const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const axios = require('axios');

// Version and description
program
  .version('1.0.0')
  .description('Generate React components using AI');

// Command line options
program
  .option('-n, --name <name>', 'Component name')
  .option('-p, --prompt <prompt>', 'Component description/prompt')
  .option('-m, --model <model>', 'Hugging Face model to use', 'microsoft/bitnet-b1.58-2B-4T')
  .option('-t, --tailwind', 'Use Tailwind CSS')
  .option('-b, --bootstrap', 'Use Bootstrap')
  .option('-o, --output <path>', 'Output directory', 'src/components')
  .option('-f, --force', 'Overwrite existing components')
  .option('-d, --debug', 'Show raw model output for debugging');

program.parse(process.argv);
const options = program.opts();

// Pre-defined component templates
const componentTemplates = {
  tailwind: (componentName) => `import React from 'react';
import PropTypes from 'prop-types';

const ${componentName} = ({ children, className, ...props }) => {
  return (
    <div className={\`\${className || ''}\`} {...props}>
      {children}
    </div>
  );
};

${componentName}.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

export default ${componentName};
`,
  bootstrap: (componentName) => `import React from 'react';
import PropTypes from 'prop-types';
import 'bootstrap/dist/css/bootstrap.min.css';

const ${componentName} = ({ children, className, ...props }) => {
  return (
    <div className={\`\${className || ''}\`} {...props}>
      {children}
    </div>
  );
};

${componentName}.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

export default ${componentName};
`,
  default: (componentName) => `import React from 'react';
import PropTypes from 'prop-types';

const ${componentName} = ({ children, ...props }) => {
  return (
    <div {...props}>
      {children}
    </div>
  );
};

${componentName}.propTypes = {
  children: PropTypes.node,
};

export default ${componentName};
`
};

// Validate Hugging Face API key
const HF_API_KEY = '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'
if (!HF_API_KEY) {
  console.error(chalk.red('Error: Hugging Face API key not found.'));
  console.log(chalk.yellow('Please set your Hugging Face API key as an environment variable:'));
  console.log(chalk.cyan('For Windows (CMD): set HF_API_KEY=your-api-key-here'));
  console.log(chalk.cyan('For Windows (PowerShell): $env:HF_API_KEY="your-api-key-here"'));
  console.log(chalk.cyan('For macOS/Linux: export HF_API_KEY="your-api-key-here"'));
  process.exit(1);
}

// Interactive prompt if options are missing
async function promptForMissingOptions() {
  const questions = [];

  if (!options.name) {
    questions.push({
      type: 'input',
      name: 'name',
      message: 'Component name:',
      validate: input => input.trim() !== '' ? true : 'Component name is required'
    });
  }

  if (!options.prompt) {
    questions.push({
      type: 'input',
      name: 'prompt',
      message: 'Describe your component:',
      validate: input => input.trim() !== '' ? true : 'Component description is required'
    });
  }

  // Only ask for model if not provided
  if (!options.model) {
    questions.push({
      type: 'list',
      name: 'model',
      message: 'Choose an AI model (free tier compatible):',
      choices: [
        'microsoft/phi-2',
        'codellama/CodeLlama-7b-hf',
        'gpt2',
        'distilgpt2',
        'bigcode/starcoderbase',
        'Salesforce/codegen-350M-mono',
        'EleutherAI/pythia-160m',
        'EleutherAI/gpt-neo-125m',
        'facebook/incoder-1B'
      ]
    });
  }

  if (!options.tailwind && !options.bootstrap) {
    questions.push({
      type: 'list',
      name: 'cssFramework',
      message: 'Choose a CSS framework:',
      choices: ['None', 'Tailwind', 'Bootstrap']
    });
  }

  const answers = await inquirer.prompt(questions);
  
  // Update options with answers
  if (answers.name) options.name = answers.name;
  if (answers.prompt) options.prompt = answers.prompt;
  if (answers.model) options.model = answers.model;
  if (answers.cssFramework === 'Tailwind') options.tailwind = true;
  if (answers.cssFramework === 'Bootstrap') options.bootstrap = true;
}

// Format component name to PascalCase
function formatComponentName(name) {
  return name
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Generate component using Hugging Face API
async function generateComponent(options) {
  const spinner = ora('Generating component with AI...').start();
  
  try {
    // Construct prompt based on options
    let frameworkInfo = 'without any CSS framework';
    if (options.tailwind) frameworkInfo = 'using Tailwind CSS for styling';
    if (options.bootstrap) frameworkInfo = 'using Bootstrap for styling';
    
    const engineeringPrompt = `
Generate a complete React functional component named ${formatComponentName(options.name)} with the following specifications:
${options.prompt}

The component should be ${frameworkInfo}.
Include imports at the top (React, PropTypes), the functional component definition, prop types, and a default export.
ONLY provide the JavaScript/JSX code, no explanation or comments outside the code.

Example format:
import React from 'react';
import PropTypes from 'prop-types';

const ComponentName = (props) => {
  return (
    // JSX here
  );
};

ComponentName.propTypes = {
  // prop types here
};

export default ComponentName;
    `;

    // Call Hugging Face API
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${options.model}`,
      { inputs: engineeringPrompt },
      {
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout
      }
    );

    spinner.succeed('AI response received');
    
    // Extract component code from response
    let componentCode;
    if (Array.isArray(response.data)) {
      componentCode = response.data[0].generated_text;
    } else if (typeof response.data === 'object' && response.data.generated_text) {
      componentCode = response.data.generated_text;
    } else {
      componentCode = String(response.data);
    }
    console.log('AI response:', response.data[0].generated_text);
    
    // Debug mode - show raw output
    if (options.debug) {
      console.log(chalk.yellow('---- DEBUG: Raw AI Output ----'));
      console.log(componentCode);
      console.log(chalk.yellow('---- End of Raw Output ----'));
    }
    
    // Cleaning up the response to extract just the component code
    componentCode = extractCodeFromResponse(componentCode);
    
    // Validate the extracted code
    if (!validateComponentCode(componentCode, formatComponentName(options.name))) {
      spinner.warn('Generated code may not be valid. Using a template instead.');
      
      // Use template based on CSS framework
      if (options.tailwind) {
        componentCode = componentTemplates.tailwind(formatComponentName(options.name));
      } else if (options.bootstrap) {
        componentCode = componentTemplates.bootstrap(formatComponentName(options.name));
      } else {
        componentCode = componentTemplates.default(formatComponentName(options.name));
      }
      
      // Apply the prompt as a comment
      componentCode = `// ${options.prompt}\n${componentCode}`;
    }
    
    return componentCode;
  } catch (error) {
    spinner.fail('Failed to generate component');
    console.error(chalk.red(`Error: ${error.message}`));
    if (error.response) {
      console.error(chalk.red(`Status: ${error.response.status}`));
      console.error(chalk.red(`Details: ${JSON.stringify(error.response.data)}`));
    }
    
    // Use template based on CSS framework as fallback
    console.log(chalk.yellow('Using a template instead.'));
    if (options.tailwind) {
      return componentTemplates.tailwind(formatComponentName(options.name));
    } else if (options.bootstrap) {
      return componentTemplates.bootstrap(formatComponentName(options.name));
    }
    return componentTemplates.default(formatComponentName(options.name));
  }
}

function extractCodeFromResponse(text) {
  // Find code between backticks or code blocks
  const codeBlockRegex = /```(?:jsx?|tsx?|react)?\s*([\s\S]*?)```/;
  const match = text.match(codeBlockRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // If no code block, try to find just the component part by looking for import statements
  const importRegex = /import\s+React/i;
  const importMatch = text.match(importRegex);
  
  if (importMatch) {
    const startIndex = text.indexOf(importMatch[0]);
    
    // Try to find end by looking for export default statement
    const exportRegex = /export\s+default\s+\w+;?/i;
    const exportMatch = text.match(exportRegex);
    
    if (exportMatch) {
      const endIndex = text.indexOf(exportMatch[0]) + exportMatch[0].length;
      return text.substring(startIndex, endIndex).trim();
    }
    
    // If we found import but not export, take from import to end
    return text.substring(startIndex).trim();
  }
  
  // Strip common boilerplate text that models might include
  let cleanedText = text;
  
  // Remove any instructions that might be in the output
  cleanedText = cleanedText.replace(/The component should be.*?styling\./, '');
  cleanedText = cleanedText.replace(/Include imports.*?export\./, '');
  cleanedText = cleanedText.replace(/Only provide.*?explanation\./, '');
  
  cleanedText = cleanedText.replace(/BUILD SUCCESS.*$/ms, '');
  
  return cleanedText.trim();
}

function validateComponentCode(code, componentName) {
  // Basic validation for component code
  const hasImportReact = /import\s+.*?React/.test(code);
  const hasComponentDefinition = new RegExp(`(function|const|let|var)\\s+${componentName}\\s*=`).test(code);
  const hasExport = /export\s+default/.test(code);
  
  // If any of these basic checks fail, return false
  if (!hasImportReact || !hasComponentDefinition || !hasExport) {
    return false;
  }
  
  // Look for suspicious patterns indicating malformed code
  const hasSuspiciousOutput = /output\.js:|output\.html:|<table>|<tbody>|The component should be/.test(code);
  
  if (hasSuspiciousOutput) {
    return false;
  }
  
  return true;
}

// Save the component to file
function saveComponent(options, componentCode) {
  const pascalCaseName = formatComponentName(options.name);
  const componentDir = path.join(process.cwd(), options.output, pascalCaseName);
  const componentFile = path.join(componentDir, `${pascalCaseName}.jsx`);
  const indexFile = path.join(componentDir, 'index.js');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(componentDir)) {
    fs.mkdirSync(componentDir, { recursive: true });
  } else if (fs.existsSync(componentFile) && !options.force) {
    console.error(chalk.red(`Error: Component ${pascalCaseName} already exists.`));
    console.log(chalk.yellow('Use the --force flag to overwrite.'));
    process.exit(1);
  }
  
  // Save component to file
  fs.writeFileSync(componentFile, componentCode);
  
  // Create index file that re-exports the component
  const indexContent = `export { default } from './${pascalCaseName}';\n`;
  fs.writeFileSync(indexFile, indexContent);
  
  console.log(chalk.green(`Component ${pascalCaseName} created successfully!`));
  console.log(chalk.cyan(`Location: ${componentDir}`));
}

// Main function
async function main() {
  console.log(chalk.bold.blue('🚀 React Component Generator'));
  
  try {
    // Check for missing options and prompt if needed
    await promptForMissingOptions();
    
    // Generate component
    const componentCode = await generateComponent(options);
    
    // Save component to file
    saveComponent(options, componentCode);
    
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

main();