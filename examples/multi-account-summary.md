# Sample Data Summary

## Files Overview

### sample-inventory.csv
- **Records**: 9
- **Accounts**: 3
- **Regions**: 3
- **Services**: 5 (EC2, S3, RDS, Lambda, DynamoDB)
- **Description**: Basic example with essential AWS services

### large-sample-inventory.csv
- **Records**: 60
- **Accounts**: 12
- **Regions**: 16 (all major AWS regions)
- **Services**: 30+ (comprehensive AWS service coverage)
- **Description**: Comprehensive example showing global multi-account infrastructure

## Key Features Demonstrated

1. **Multi-Account Structure**
   - Production accounts
   - Development accounts
   - Region-specific accounts

2. **Global Distribution**
   - North America: us-east-1, us-west-2, ca-central-1
   - Europe: eu-west-1, eu-west-2, eu-west-3, eu-central-1, eu-north-1
   - Asia Pacific: ap-southeast-1, ap-southeast-2, ap-northeast-1, ap-northeast-2, ap-south-1
   - South America: sa-east-1

3. **Service Categories**
   - Compute: EC2, Lambda, ECS, EKS
   - Storage: S3, EBS
   - Database: RDS, DynamoDB, Redshift
   - Networking: VPC, ELB, Route53, CloudFront
   - Security: KMS, GuardDuty, WAF, Secrets Manager
   - Analytics: Glue, Athena, Kinesis, EMR
   - ML/AI: SageMaker
   - DevOps: CodePipeline, CloudFormation

4. **Tagging Examples**
   - Environment tags (Production, Development, Testing)
   - Solution tags (SOL)
   - Compliance tags (GDPR, PCI)
   - Team ownership tags
   - Cost center tags

5. **Metadata Examples**
   - Instance types and states
   - Storage sizes and classes
   - Configuration details
   - Performance metrics

## Usage Tips

1. Upload both files to see multi-file aggregation
2. Use filters to explore specific accounts or regions
3. Check the Tag Analysis view to see tag distribution
4. Use the Heat Map to visualize global resource distribution
5. Explore Category Details for service-specific insights