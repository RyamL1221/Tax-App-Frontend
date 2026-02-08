# Tax App Frontend Documentation

## Overview

This folder contains all project documentation organized by category. Each category has its own README explaining the types of documents stored there and when to add new documentation.

## Documentation Structure

### 📋 [Implementation](./implementation/)
Task summaries, implementation notes, and checkpoint documents from feature development.

**Contains:**
- Task implementation summaries
- Checkpoint verification documents
- Development progress notes

### ✅ [Verification](./verification/)
Testing documentation, verification reports, and quality assurance documents.

**Contains:**
- Test results and analysis
- Accessibility verification reports
- Manual testing checklists
- Test failure analysis

### 🐛 [Debugging](./debugging/)
Debugging sessions, investigations, root cause analyses, and fix documentation.

**Contains:**
- Debug session notes
- Investigation results
- Root cause analyses
- Fix verification documents

### 🎯 [Features](./features/)
Feature implementation summaries and completion documentation.

**Contains:**
- Feature implementation summaries
- Feature completion reports
- Feature-specific documentation

### ⚙️ [System](./system/)
System setup, configuration, and infrastructure documentation.

**Contains:**
- System setup guides
- Configuration documentation
- Infrastructure notes

## Quick Links

- [Implementation Documentation](./implementation/README.md)
- [Verification Documentation](./verification/README.md)
- [Debugging Documentation](./debugging/README.md)
- [Feature Documentation](./features/README.md)
- [System Documentation](./system/README.md)

## Adding New Documentation

When creating new documentation, follow these guidelines:

### Documentation Placement Decision Tree

1. **Is it a spec document?** → Place in `.kiro/specs/{feature-name}/`
2. **Is it steering/guidelines?** → Place in `.kiro/steering/`
3. **Is it task-specific or implementation notes?** → Place in `/docs/implementation/`
4. **Is it about testing or verification?** → Place in `/docs/verification/`
5. **Is it about debugging or investigation?** → Place in `/docs/debugging/`
6. **Is it a feature summary?** → Place in `/docs/features/`
7. **Is it system setup or configuration?** → Place in `/docs/system/`

### File Naming Conventions

- Use lowercase with hyphens: `my-document-name.md`
- Be descriptive: `task-5.1-implementation-summary.md`
- Include context: `debug-jwt-token-persistence.md`

### Important Rules

- **Never create markdown files in the project root** (except README.md)
- All documentation must go in the appropriate category folder
- Each document should have a clear, descriptive name
- Update the category README when adding significant documentation

## Documentation Maintenance

For detailed guidelines on documentation maintenance, see:
- [Documentation Maintenance Steering](./.kiro/steering/documentation-maintenance.md)

## Project Documentation Locations

- **Spec Documents**: `.kiro/specs/{feature-name}/` (requirements, design, tasks)
- **Steering Guidelines**: `.kiro/steering/` (project guidelines and standards)
- **General Documentation**: `/docs/` (organized by category as shown above)
- **Code Documentation**: Inline comments and JSDoc in source files

## Finding Documentation

1. **By Category**: Browse the category folders above
2. **By Feature**: Check `.kiro/specs/{feature-name}/` for feature-specific specs
3. **By Type**: Use the category READMEs to understand what's stored where
4. **By Topic**: Search within the appropriate category folder

## Contributing Documentation

When contributing documentation:

1. Determine the appropriate category using the decision tree above
2. Follow the file naming conventions
3. Add your document to the appropriate category folder
4. Update the category README if adding a new type of document
5. Ensure your documentation is clear, concise, and well-formatted

## Questions?

If you're unsure where to place documentation, refer to:
- The decision tree above
- The [Documentation Maintenance Steering](./.kiro/steering/documentation-maintenance.md)
- Ask the team for guidance
