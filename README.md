# AWS Multi-Account Inventory Dashboard

A powerful React-based dashboard for visualizing and managing AWS resources across multiple accounts and regions. Built for Rackspace Cloud Intelligence Platform.

![AWS Inventory Dashboard](https://img.shields.io/badge/AWS-Multi--Account-orange)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Features

### Core Functionality
- **Multi-File Upload**: Upload and combine multiple AWS inventory CSV files
- **Real-time Processing**: Parse and visualize thousands of resources instantly
- **Smart Tag Parsing**: Automatically extracts and parses embedded JSON tags and metadata
- **Advanced Filtering**: Filter by account, region, service category, and custom search
- **Export Capability**: Export filtered data back to CSV format

### Visualization Views

#### 1. **Overview Dashboard**
- Key metrics cards showing total resources, accounts, regions, and services
- Account comparison charts
- Quick insights panel with most used services and tag coverage

#### 2. **Geographic Heat Map**
- Interactive world map with bubble visualization
- Resource concentration by AWS region
- Hover details and statistics
- Top regions panel

#### 3. **Services Analysis**
- Bar charts showing resource distribution by service
- Category distribution pie chart
- Service utilization metrics

#### 4. **Category Details**
- Tabbed interface for service categories (Compute, Storage, Networking, etc.)
- Detailed resource listings with tags and metadata
- Category-specific statistics

#### 5. **Tag Analysis**
- Tag usage visualization
- Coverage statistics
- Most common tags identification

#### 6. **Resource Table**
- Paginated table view of all resources
- Sortable columns
- Tag display

#### 7. **File Management**
- Upload multiple CSV files
- Remove individual files
- File statistics and distribution

## 📋 Prerequisites

- Node.js 14.0 or higher
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/jon-the-dev/aws-inventory-dashboard.git
cd aws-inventory-dashboard
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📊 CSV File Format

The dashboard expects CSV files with the following columns:

| Column | Description | Required |
|--------|-------------|----------|
| `accountid` | AWS Account ID | Yes |
| `region` | AWS Region (e.g., us-east-1) | Yes |
| `service` | AWS Service name (e.g., ec2, s3) | Yes |
| `resource_type` | Type of resource | Yes |
| `'tags_json'` or `tags_json` | JSON string of resource tags | No |
| `'metadata_json'` or `metadata_json` | JSON string of resource metadata | No |

### Example CSV:
```csv
accountid,region,service,resource_type,'tags_json','metadata_json'
123456789012,us-east-1,ec2,instance,'{"Name":"WebServer","Environment":"Production"}','{"InstanceType":"t3.medium"}'
123456789012,eu-west-1,s3,bucket,'{"Project":"DataLake","Owner":"DataTeam"}','{"BucketSize":"1TB"}'
```

## 🎯 Usage

1. **Upload Data**: Click "Upload CSV Files" and select one or more inventory files
2. **Navigate Views**: Use the tab navigation to switch between different visualizations
3. **Filter Resources**: Use the filter controls to narrow down resources by:
   - Account ID
   - AWS Region
   - Service Category
   - Free text search
   - Source file (when multiple files are loaded)
4. **Export Data**: Click "Export" to download the filtered data as CSV

## 🏗️ Architecture

### Technology Stack
- **React 18**: Modern React with hooks
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Charting library for data visualization
- **Lucide React**: Icon library
- **PapaParse**: CSV parsing
- **Lodash**: Utility functions

### Component Structure
```
src/
├── App.js                           # Main app component
├── components/
│   └── AWSInventoryDashboard.jsx    # Main dashboard component
├── App.css                          # Global styles
└── index.js                         # React entry point
```

## 🔧 Configuration

### AWS Regions
The dashboard includes coordinates for major AWS regions. To add new regions, update the `AWS_REGIONS` object in the component:

```javascript
const AWS_REGIONS = {
  'region-code': { name: 'Display Name', lat: latitude, lng: longitude },
  // ...
};
```

### Service Categories
Customize service groupings by modifying the `SERVICE_CATEGORIES` object:

```javascript
const SERVICE_CATEGORIES = {
  compute: ['ec2', 'lambda', 'ecs', ...],
  storage: ['s3', 'ebs', 'efs', ...],
  // ...
};
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
# or
yarn build
```

This creates an optimized production build in the `build/` directory.

### Deploy to Static Hosting
The built application can be deployed to any static hosting service:
- AWS S3 + CloudFront
- Netlify
- Vercel
- GitHub Pages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for Rackspace Cloud Intelligence Platform
- Designed for multi-account AWS infrastructure management
- Inspired by the need for better AWS resource visibility

## 📞 Support

For issues, questions, or contributions, please:
1. Check the [Issues](https://github.com/jon-the-dev/aws-inventory-dashboard/issues) page
2. Create a new issue if needed
3. Submit a pull request for contributions

---

Made with ❤️ for the Rackspace team