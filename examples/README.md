# Example CSV Files

This directory contains sample CSV files that demonstrate the expected format for the AWS Multi-Account Inventory Dashboard.

## Files

- `sample-inventory.csv` - A basic example with multiple AWS accounts, regions, and services
- Use these files to test the dashboard functionality

## CSV Format

The CSV files should include:
- `accountid` - AWS Account ID
- `region` - AWS Region code
- `service` - AWS Service name
- `resource_type` - Type of resource
- `'tags_json'` - JSON string of tags (note the single quotes around the column name)
- `'metadata_json'` - JSON string of metadata

## Testing

1. Start the dashboard application
2. Click "Upload CSV Files"
3. Select one or more example files
4. Explore the various visualization views

## Creating Your Own Test Data

You can create additional test files by following the same format. Make sure:
- JSON strings are properly escaped
- Column names match exactly (including quotes if present)
- Each row represents a single AWS resource