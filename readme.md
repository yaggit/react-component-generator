# React Component Generator CLI

A powerful command-line tool that uses AI to generate React components based on your descriptions.

## Features

- 🧠 AI-powered component generation using Hugging Face models
- 🎨 Support for Tailwind CSS and Bootstrap styling
- 🖥️ Interactive command-line interface
- 💾 Automatic file structure creation
- 🌎 Cross-platform compatibility (Windows, macOS, Linux)

## Installation

### Prerequisites

- Node.js (v12 or higher)
- npm or yarn
- Hugging Face API key

### Global Installation

```bash
# Clone the repository (or download it)
git clone https://github.com/yourusername/react-component-generator.git
cd react-component-generator

# Install dependencies
npm install

# Install globally
npm install -g .
```

### Setting up Hugging Face API Key

Before using the tool, you need to set your Hugging Face API key as an environment variable:

**For Windows (Command Prompt):**
```cmd
set HF_API_KEY=your-hugging-face-api-key-here
```

**For Windows (PowerShell):**
```powershell
$env:HF_API_KEY="your-hugging-face-api-key-here"
```

**For macOS/Linux:**
```bash
export HF_API_KEY="your-hugging-face-api-key-here"
```

For persistent configuration:
- **Windows**: Add a system environment variable through System Properties
- **macOS/Linux**: Add to your `.bashrc`, `.zshrc`, or appropriate shell config file

## Usage

### Basic Command

```bash
generate-component
```

Running the command without arguments will start an interactive prompt to guide you through the component creation process.

### Command Options

```bash
generate-component --name Button --prompt "A reusable button component with primary, secondary, and disabled states" --tailwind
```

### Available Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--name` | `-n` | Component name | *(interactive prompt)* |
| `--prompt` | `-p` | Component description | *(interactive prompt)* |
| `--model` | `-m` | Hugging Face model to use | `meta-llama/Llama-2-70b-chat-hf` |
| `--tailwind` | `-t` | Use Tailwind CSS | `false` |
| `--bootstrap` | `-b` | Use Bootstrap | `false` |
| `--output` | `-o` | Output directory | `src/components` |
| `--force` | `-f` | Overwrite existing components | `false` |
| `--debug` | `-d` | Show raw model output for debugging | `false` |

### Examples

**Generate a Button with Tailwind CSS:**
```bash
generate-component --name Button --prompt "A primary button with hover effects and loading state" --tailwind
```

**Generate a Form with Bootstrap:**
```bash
generate-component --name LoginForm --bootstrap --prompt "A login form with email and password validation"
```

**Use a specific AI model:**
```bash
generate-component --name DataTable --model "bigcode/starcoder" --prompt "A sortable data table component with pagination"
```

**Change the output directory:**
```bash
generate-component --name Modal --output "src/ui-components" --prompt "A reusable modal dialog with backdrop"
```

**Overwrite an existing component:**
```bash
generate-component --name Button --prompt "Updated button with new styling" --force
```

## Recommended Models

The quality of generated components largely depends on the AI model you choose. Here are some recommended models:

- `meta-llama/Llama-2-70b-chat-hf` - Good all-around performance for React components
- `bigcode/starcoder` - Specialized for code generation
- `google/gemma-7b` - Balanced performance and speed
- `microsoft/phi-2` - Lightweight model with decent code generation

If you encounter issues with a particular model, try switching to a different one.

## Generated File Structure

For a component named `Button`, the CLI will create:

```
src/components/Button/
├── Button.jsx      # The main component file
└── index.js        # Re-export file for easier imports
```

This structure allows you to import components in your React application like this:

```javascript
import Button from './components/Button';
```

## Troubleshooting

### Command not found

If you encounter "command not found" errors after installation:

```bash
# Try running with npx
npx react-component-generator

# Or with the full path
node /path/to/react-component-generator/bin/cli.js
```

### API Connection Issues

If you're having trouble connecting to the Hugging Face API:

1. Verify your API key is correctly set:
   ```bash
   echo %HF_API_KEY%  # Windows
   echo $HF_API_KEY   # macOS/Linux
   ```
2. Check your internet connection
3. Some models may require Hugging Face Pro subscription

### Poor Quality Components

If the generated components are low quality:

1. Use the `--debug` flag to see the raw model output
2. Try a different model with `--model` flag
3. Provide more detailed prompts with specific requirements
4. The tool will automatically fall back to a template if the generated code is invalid

## Extending the Tool

You can extend the functionality by modifying the source code:

- Add new component templates in the `componentTemplates` object
- Support for additional CSS frameworks
- Add TypeScript support
- Generate test files along with components