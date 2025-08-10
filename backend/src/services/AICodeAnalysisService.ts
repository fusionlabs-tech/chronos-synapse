import { logger } from '../utils/logger';

export interface SecurityAnalysis {
 isSafe: boolean;
 warnings: string[];
}

export interface AICodeAnalysis {
 securityScore: number; // 0-100
 riskLevel: 'low' | 'medium' | 'high' | 'critical';
 securityIssues: Array<{
  type: 'vulnerability' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  line?: number;
  suggestion?: string;
 }>;
 bestPractices: Array<{
  category: string;
  suggestions: string[];
 }>;
 resourceEstimate: {
  cpu: string;
  memory: string;
  disk: string;
  network: boolean;
 };
 complexity: {
  cyclomatic: number;
  maintainability: 'low' | 'medium' | 'high';
  readability: 'low' | 'medium' | 'high';
 };
 recommendations: string[];
}

export interface CodeAnalysisRequest {
 code: string;
 language: string;
 context?: {
  jobType?: string;
  environment?: string;
  dependencies?: string[];
 };
}

export class AICodeAnalysisService {
 private claudeApiKey: string;
 private claudeModel: string = 'claude-3-5-sonnet-20241022';

 constructor() {
  this.claudeApiKey = process.env.ANTHROPIC_API_KEY || '';
  if (!this.claudeApiKey) {
   logger.warn('Claude API key not found. AI code analysis will be limited.');
  }
 }

 async analyzeCode(request: CodeAnalysisRequest): Promise<AICodeAnalysis> {
  try {
   if (!this.claudeApiKey) {
    logger.info('No Claude API key found, using basic analysis only');
    return this.getBasicAnalysis(request);
   }

   const aiAnalysis = await this.performAIAnalysis(request);
   return aiAnalysis;
  } catch (error) {
   logger.error(
    'AI code analysis failed, falling back to basic analysis:',
    error
   );
   return this.getBasicAnalysis(request);
  }
 }

 private async performAIAnalysis(
  request: CodeAnalysisRequest
 ): Promise<AICodeAnalysis> {
  const prompt = this.buildAnalysisPrompt(request);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
   method: 'POST',
   headers: {
    'Content-Type': 'application/json',
    'x-api-key': this.claudeApiKey,
    'anthropic-version': '2023-06-01',
   },
   body: JSON.stringify({
    model: this.claudeModel,
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
   }),
  });

  if (!response.ok) {
   throw new Error(
    `Claude API error: ${response.status} ${response.statusText}`
   );
  }

  const data = (await response.json()) as { content: { text: string }[] };
  const analysisText = data.content[0].text;

  return this.parseAIAnalysis(analysisText, request);
 }

 private buildAnalysisPrompt(request: CodeAnalysisRequest): string {
  return `You are analyzing code that will run in a secure sandboxed environment with the following constraints:
- No access to host filesystem except /tmp
- No package installation (only built-in language features)
- Controlled network access (only outbound HTTP/HTTPS)
- Resource limits (CPU, memory, disk)
- No privilege escalation possible

Analyze this ${request.language} code for security, quality, and resource usage:

\`\`\`${request.language}
${request.code}
\`\`\`

Provide a JSON response with the following structure:
{ ... }`;
 }

 private parseAIAnalysis(
  analysisText: string,
  request: CodeAnalysisRequest
 ): AICodeAnalysis {
  try {
   const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
   if (!jsonMatch) {
    throw new Error('No JSON found in AI response');
   }
   const parsed = JSON.parse(jsonMatch[0]);
   return {
    securityScore: Math.max(0, Math.min(100, parsed.securityScore || 50)),
    riskLevel: this.validateRiskLevel(parsed.riskLevel),
    securityIssues: this.normalizeSecurityIssues(parsed.securityIssues || []),
    bestPractices: this.normalizeBestPractices(parsed.bestPractices || []),
    resourceEstimate: this.normalizeResourceEstimate(parsed.resourceEstimate),
    complexity: this.normalizeComplexity(parsed.complexity),
    recommendations: Array.isArray(parsed.recommendations)
     ? parsed.recommendations
     : [],
   };
  } catch (error) {
   logger.error('Failed to parse AI analysis:', error);
   return this.getBasicAnalysis(request);
  }
 }

 private getBasicAnalysis(request: CodeAnalysisRequest): AICodeAnalysis {
  const basicSecurityIssues = this.getBasicSecurityIssues(
   request.code,
   request.language
  );
  const securityScore = Math.max(0, 100 - basicSecurityIssues.length * 20);

  return {
   securityScore,
   riskLevel:
    securityScore > 80
     ? 'low'
     : securityScore > 60
       ? 'medium'
       : securityScore > 40
         ? 'high'
         : 'critical',
   securityIssues: basicSecurityIssues,
   bestPractices: this.getBasicBestPractices(request.language),
   resourceEstimate: this.estimateBasicResources(
    request.code,
    request.language
   ),
   complexity: this.estimateBasicComplexity(request.code),
   recommendations: this.getBasicRecommendations(basicSecurityIssues),
  };
 }

 private getBasicSecurityIssues(
  code: string,
  language: string
 ): AICodeAnalysis['securityIssues'] {
  const issues: AICodeAnalysis['securityIssues'] = [];
  const lowerCode = code.toLowerCase();

  switch (language.toLowerCase()) {
   case 'python':
    if (lowerCode.includes('eval(') || lowerCode.includes('exec(')) {
     issues.push({
      type: 'vulnerability',
      severity: 'critical',
      title: 'Dangerous Code Execution',
      description: 'eval() or exec() functions can execute arbitrary code',
      suggestion: 'Avoid using eval() or exec().',
     });
    }
    if (
     lowerCode.includes('os.system(') ||
     lowerCode.includes('subprocess.call(')
    ) {
     issues.push({
      type: 'vulnerability',
      severity: 'high',
      title: 'System Command Execution',
      description: 'System command execution detected',
      suggestion: 'Avoid direct system calls.',
     });
    }
    if (lowerCode.includes('__import__(')) {
     issues.push({
      type: 'vulnerability',
      severity: 'high',
      title: 'Dynamic Module Import',
      description: 'Dynamic module import detected',
      suggestion: 'Avoid dynamic imports.',
     });
    }
    if (lowerCode.includes('open(') && !lowerCode.includes('/tmp/')) {
     issues.push({
      type: 'warning',
      severity: 'medium',
      title: 'File System Access',
      description: 'File system access outside /tmp detected',
      suggestion: 'Only access files within /tmp.',
     });
    }
    break;
   case 'javascript':
   case 'node':
    if (
     lowerCode.includes('eval(') ||
     lowerCode.includes('function(') ||
     lowerCode.includes('settimeout(')
    ) {
     issues.push({
      type: 'vulnerability',
      severity: 'critical',
      title: 'Dangerous Code Execution',
      description: 'eval() or Function() can execute arbitrary code',
      suggestion: 'Avoid eval() or Function().',
     });
    }
    if (
     lowerCode.includes('require(') &&
     (lowerCode.includes('child_process') || lowerCode.includes('fs'))
    ) {
     issues.push({
      type: 'vulnerability',
      severity: 'high',
      title: 'System Access Module',
      description: 'System access modules detected',
      suggestion: 'Avoid child_process or fs in sandbox.',
     });
    }
    if (
     lowerCode.includes('process.exit(') ||
     lowerCode.includes('process.kill(')
    ) {
     issues.push({
      type: 'vulnerability',
      severity: 'high',
      title: 'Process Control',
      description: 'Process control functions detected',
      suggestion: 'Avoid process.exit() or process.kill().',
     });
    }
    const timeoutMatch = lowerCode.match(/settimeout\([^,]*,\s*(\d+)\)/);
    if (timeoutMatch && parseInt(timeoutMatch[1]) > 30000) {
     issues.push({
      type: 'warning',
      severity: 'medium',
      title: 'Long Timeout',
      description: 'Long timeout detected (>30s)',
      suggestion: 'Keep timeouts under 30 seconds.',
     });
    }
    break;
   case 'bash':
   case 'shell':
    if (lowerCode.includes('sudo ') || lowerCode.includes('su ')) {
     issues.push({
      type: 'vulnerability',
      severity: 'critical',
      title: 'Privilege Escalation',
      description: 'Privilege escalation attempt detected',
      suggestion: 'Avoid sudo or su.',
     });
    }
    if (lowerCode.includes('rm -rf ') && !lowerCode.includes('/tmp/')) {
     issues.push({
      type: 'vulnerability',
      severity: 'high',
      title: 'Dangerous File Deletion',
      description: 'Recursive deletion detected',
      suggestion: 'Only delete within /tmp.',
     });
    }
    if (lowerCode.includes('eval ') || lowerCode.includes('exec ')) {
     issues.push({
      type: 'vulnerability',
      severity: 'critical',
      title: 'Command Evaluation',
      description: 'Command evaluation detected',
      suggestion: 'Avoid eval or exec.',
     });
    }
    break;
   default:
    if (lowerCode.includes('system(') || lowerCode.includes('shell_exec(')) {
     issues.push({
      type: 'vulnerability',
      severity: 'high',
      title: 'System Command Execution',
      description: 'System command execution detected',
      suggestion: 'Avoid system commands.',
     });
    }
  }

  return issues;
 }

 private getBasicBestPractices(
  language: string
 ): AICodeAnalysis['bestPractices'] {
  const practices: Record<string, string[]> = {
   python: [
    'Use virtual environments',
    'Validate all inputs',
    'Use parameterized queries',
    'Handle exceptions properly',
    'Use environment variables for secrets',
   ],
   javascript: [
    'Use strict mode',
    'Validate inputs',
    'Use HTTPS for API calls',
    'Sanitize user inputs',
    'Use environment variables for secrets',
   ],
   bash: [
    'Quote all variables',
    'Use set -e for error handling',
    'Validate file paths',
    'Use proper exit codes',
    'Avoid eval and command substitution',
   ],
  };

  return [
   {
    category: 'Security',
    suggestions: practices[language.toLowerCase()] || [
     'Validate inputs',
     'Use secure practices',
    ],
   },
  ];
 }

 private estimateBasicResources(
  code: string,
  language: string
 ): AICodeAnalysis['resourceEstimate'] {
  const lines = code.split('\n').length;
  const hasLoops = /for|while|map|filter|reduce/.test(code);
  const hasFileIO = /read|write|open|fs\.|file/.test(code);
  const hasNetwork = /fetch|axios|http|request|curl|wget/.test(code);

  let cpu = '0.1';
  let memory = '128m';
  let disk = '100m';

  if (lines > 100) {
   cpu = '0.3';
   memory = '256m';
  }
  if (hasLoops) {
   cpu = '0.5';
   memory = '512m';
  }
  if (hasFileIO) {
   disk = '500m';
  }
  if (hasNetwork) {
   memory = '512m';
  }

  return { cpu, memory, disk, network: hasNetwork };
 }

 private estimateBasicComplexity(code: string): AICodeAnalysis['complexity'] {
  const lines = code.split('\n').length;
  const cyclomatic = (code.match(/if|for|while|case|catch/g) || []).length + 1;

  return {
   cyclomatic,
   maintainability: lines < 50 ? 'high' : lines < 200 ? 'medium' : 'low',
   readability: cyclomatic < 10 ? 'high' : cyclomatic < 20 ? 'medium' : 'low',
  };
 }

 private getBasicRecommendations(
  issues: AICodeAnalysis['securityIssues']
 ): string[] {
  const recommendations = ['Review code for security best practices'];

  if (issues.length > 0) {
   recommendations.push('Address identified security issues');
  }

  return recommendations;
 }

 private validateRiskLevel(level: string): AICodeAnalysis['riskLevel'] {
  const validLevels: AICodeAnalysis['riskLevel'][] = [
   'low',
   'medium',
   'high',
   'critical',
  ];
  return validLevels.includes(level as any)
   ? (level as AICodeAnalysis['riskLevel'])
   : 'medium';
 }

 private normalizeSecurityIssues(
  issues: any[]
 ): AICodeAnalysis['securityIssues'] {
  return issues.map((issue) => ({
   type: issue.type || 'warning',
   severity: this.validateRiskLevel(issue.severity || 'medium'),
   title: issue.title || 'Security Issue',
   description: issue.description || 'Unknown security issue',
   line: issue.line,
   suggestion: issue.suggestion,
  }));
 }

 private normalizeBestPractices(
  practices: any[]
 ): AICodeAnalysis['bestPractices'] {
  return practices.map((practice) => ({
   category: practice.category || 'General',
   suggestions: Array.isArray(practice.suggestions) ? practice.suggestions : [],
  }));
 }

 private normalizeResourceEstimate(
  estimate: any
 ): AICodeAnalysis['resourceEstimate'] {
  return {
   cpu: estimate?.cpu || '0.1',
   memory: estimate?.memory || '128m',
   disk: estimate?.disk || '100m',
   network: Boolean(estimate?.network),
  };
 }

 private normalizeComplexity(complexity: any): AICodeAnalysis['complexity'] {
  return {
   cyclomatic: complexity?.cyclomatic || 1,
   maintainability: complexity?.maintainability || 'medium',
   readability: complexity?.readability || 'medium',
  };
 }

 /**
  * Combine AI analysis with basic security checks
  */
 async getComprehensiveAnalysis(request: CodeAnalysisRequest): Promise<{
  aiAnalysis: AICodeAnalysis;
  basicSecurity: SecurityAnalysis;
  combined: {
   isSafe: boolean;
   overallScore: number;
   criticalIssues: number;
   recommendations: string[];
  };
 }> {
  const [aiAnalysis, basicSecurity] = await Promise.all([
   this.analyzeCode(request),
   this.getBasicSecurityAnalysis(request.code, request.language),
  ]);

  const criticalIssues = aiAnalysis.securityIssues.filter(
   (issue) => issue.severity === 'critical'
  ).length;
  const overallScore = Math.min(
   aiAnalysis.securityScore,
   basicSecurity.isSafe ? 100 : 50
  );

  return {
   aiAnalysis,
   basicSecurity,
   combined: {
    isSafe:
     // Very lenient for sandboxed environments - only block truly dangerous code
     aiAnalysis.securityScore >= 70 && // Standard threshold for sandboxed environments
     basicSecurity.isSafe &&
     criticalIssues === 0, // Only block actual critical execution issues
    overallScore,
    criticalIssues,
    recommendations: [...aiAnalysis.recommendations, ...basicSecurity.warnings],
   },
  };
 }

 /**
  * Get basic security analysis (local static checks)
  */
 private async getBasicSecurityAnalysis(
  code: string,
  language: string
 ): Promise<SecurityAnalysis> {
  const issues = this.getBasicSecurityIssues(code, language);
  return {
   isSafe: !issues.some(
    (i) => i.severity === 'critical' || i.severity === 'high'
   ),
   warnings: issues.map((i) => `${i.severity.toUpperCase()}: ${i.title}`),
  };
 }
}

// Create and export singleton instance
export const aiCodeAnalysisService = new AICodeAnalysisService();
