export const LANGUAGES = [
 { value: 'python', label: 'Python' },
 { value: 'javascript', label: 'JavaScript' },
];

export const DEFAULT_TEMPLATES = {
 python: `#!/usr/bin/env python3
import requests
import json
from datetime import datetime

def main():
    """Main job function"""
    print(f"Job started at {datetime.now()}")
    
    try:
        # Example: Fetch data from API
        response = requests.get('https://api.github.com/users/octocat')
        data = response.json()
        
        print(f"User: {data.get('login', 'Unknown')}")
        print(f"Created: {data.get('created_at', 'Unknown')}")
        
        # Process data here
        # Your custom logic goes here
        
        print("Job completed successfully")
        return 0
        
    except Exception as e:
        print(f"Error: {e}")
        return 1

if __name__ == "__main__":
    exit(main())`,

 javascript: `// Job script
const https = require('https');

async function main() {
    console.log('Job started at', new Date().toISOString());
    
    try {
        // Example: Fetch data from API
        const data = await fetchData('https://api.github.com/users/octocat');
        console.log('User:', data.login || 'Unknown');
        console.log('Created:', data.created_at || 'Unknown');
        
        // Process data here
        // Your custom logic goes here
        
        console.log('Job completed successfully');
        return 0;
    } catch (error) {
        console.error('Error:', error);
        return 1;
    }
}

function fetchData(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

main().then(exitCode => process.exit(exitCode))`,
};
