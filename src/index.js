// react-component-generator/src/index.js
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
  .option('-m, --model <model>', 'Hugging Face model to use', 'Salesforce/codet5-base')
  .option('-t, --tailwind', 'Use Tailwind CSS')
  .option('-b, --bootstrap', 'Use Bootstrap')
  .option('-o, --output <path>', 'Output directory', 'src/components')
  .option('-f, --force', 'Overwrite existing components');

program.parse(process.argv);
const options = program.opts();

// Validate Hugging Face API key
const HF_API_KEY = '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';
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
Include imports, prop types, and a default export.
Only provide the JavaScript/JSX code without explanation.
    `;

    // Call Hugging Face API
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${options.model? options.model : 'openai-community/gpt2'}`,
      { inputs: engineeringPrompt },
      {
        headers: {
          'Authorization': `Bearer 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`,
          'Content-Type': 'application/json'
        }
      }
    );

    spinner.succeed('Component generated successfully');
    console.log('Generate code:', response.data[0].generated_text);
    // Extract component code from response
    let componentCode = response.data[0].generated_text;
    
    // Cleaning up the response to extract just the component code
    componentCode = extractCodeFromResponse(componentCode);
    
    return componentCode;
  } catch (error) {
    spinner.fail('Failed to generate component');
    console.error(chalk.red(`Error: ${error.message}`));
    if (error.response) {
      console.error(chalk.red(`Status: ${error.response.status}`));
      console.error(chalk.red(`Details: ${JSON.stringify(error.response.data)}`));
    }
    process.exit(1);
  }
}

function extractCodeFromResponse(text) {
  // Find code between backticks or just take the whole response if no code block is found
  const codeBlockRegex = /```(?:jsx?|tsx?|react)?\s*([\s\S]*?)```/;
  const match = text.match(codeBlockRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // If no code block, try to find just the component part
  const importRegex = /^import.*React/m;
  const startIndex = text.search(importRegex);
  
  if (startIndex !== -1) {
    return text.substring(startIndex).trim();
  }
  
  return text.trim();
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