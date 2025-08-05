import React, { useState, useMemo, useCallback } from 'react';
import { Upload, Cloud, Server, Database, Network, Zap, Filter, Download, Search, TrendingUp, AlertCircle, Shield, DollarSign, Tag, BarChart3, Map, Grid3X3, Eye, ChevronDown, X, FileText, Trash2, Home, HardDrive, Layers, Tags, Table, Files } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Treemap, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import Papa from 'papaparse';
import _ from 'lodash';

const AWS_REGIONS = {
  'us-east-1': { name: 'N. Virginia', lat: 38.7469, lng: -77.4758 },
  'us-east-2': { name: 'Ohio', lat: 40.4173, lng: -82.9071 },
  'us-west-1': { name: 'N. California', lat: 37.3541, lng: -121.9552 },
  'us-west-2': { name: 'Oregon', lat: 45.8491, lng: -119.7143 },
  'eu-west-1': { name: 'Ireland', lat: 53.4129, lng: -8.2439 },
  'eu-central-1': { name: 'Frankfurt', lat: 50.1109, lng: 8.6821 },
  'ap-southeast-1': { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  'ap-northeast-1': { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  'sa-east-1': { name: 'São Paulo', lat: -23.5505, lng: -46.6333 },
  'ap-south-1': { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  'ap-southeast-2': { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  'ca-central-1': { name: 'Canada', lat: 45.5017, lng: -73.5673 },
  'eu-west-2': { name: 'London', lat: 51.5074, lng: -0.1278 },
  'eu-west-3': { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  'eu-north-1': { name: 'Stockholm', lat: 59.3293, lng: 18.0686 },
  'ap-northeast-2': { name: 'Seoul', lat: 37.5665, lng: 126.9780 }
};

const SERVICE_CATEGORIES = {
  compute: ['ec2', 'lambda', 'ecs', 'eks', 'fargate', 'batch', 'lightsail'],
  storage: ['s3', 'ebs', 'efs', 'fsx', 'glacier', 'storage-gateway'],
  database: ['rds', 'dynamodb', 'elasticache', 'redshift', 'documentdb', 'neptune', 'timestream'],
  networking: ['vpc', 'cloudfront', 'route53', 'elb', 'direct-connect', 'transit-gateway', 'api-gateway'],
  serverless: ['lambda', 'dynamodb', 'api-gateway', 'sqs', 'sns', 'eventbridge', 'step-functions'],
  security: ['iam', 'kms', 'secrets-manager', 'waf', 'shield', 'guardduty', 'security-hub'],
  analytics: ['athena', 'emr', 'kinesis', 'glue', 'quicksight', 'opensearch'],
  ml: ['sagemaker', 'comprehend', 'rekognition', 'polly', 'translate', 'forecast'],
  devops: ['codecommit', 'codebuild', 'codedeploy', 'codepipeline', 'cloudformation', 'systems-manager']
};

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];

export default function AWSInventoryDashboard() {
  const [data, setData] = useState([]);
  const [loadedFiles, setLoadedFiles] = useState([]);
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedFile, setSelectedFile] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeCategory, setActiveCategory] = useState('compute');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = useCallback((event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    setIsLoading(true);
    
    const filePromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log(`Parsing ${file.name}...`);
            console.log('Total rows found:', results.data.length);
            console.log('Headers:', results.meta.fields);
            
            if (results.data.length === 0) {
              console.error('No data found in file:', file.name);
              resolve({
                fileName: file.name,
                fileSize: file.size,
                recordCount: 0,
                data: []
              });
              return;
            }
            
            console.log('First row:', results.data[0]);
            
            const processedData = results.data.map((row, index) => {
              try {
                // Get all the base fields
                const baseFields = { ...row };
                
                // Initialize tags and metadata
                let tags = {};
                let metadata = {};
                
                // Try different possible column names for tags
                const possibleTagColumns = ["'tags_json'", 'tags_json', 'tags', '"tags_json"'];
                const possibleMetadataColumns = ["'metadata_json'", 'metadata_json', 'metadata', '"metadata_json"'];
                
                // Debug first row to see actual column names and values
                if (index === 0) {
                  console.log('First row columns and values:');
                  Object.entries(row).forEach(([key, value]) => {
                    if (key.toLowerCase().includes('tag') || key.toLowerCase().includes('metadata')) {
                      console.log(`  ${key}: ${typeof value} = ${value?.substring ? value.substring(0, 100) + '...' : value}`);
                    }
                  });
                }
                
                // Find and parse tags
                for (const col of possibleTagColumns) {
                  if (row[col] !== undefined) {
                    try {
                      let value = row[col];
                      if (value && value !== '' && value !== 'null' && value !== null) {
                        // Remove surrounding quotes if present
                        if (typeof value === 'string') {
                          // Remove leading/trailing single or double quotes
                          value = value.trim();
                          if ((value.startsWith("'") && value.endsWith("'")) || 
                              (value.startsWith('"') && value.endsWith('"'))) {
                            value = value.slice(1, -1);
                          }
                        }
                        tags = typeof value === 'string' ? JSON.parse(value) : value;
                      }
                      delete baseFields[col];
                      break;
                    } catch (e) {
                      console.warn(`Row ${index}: Failed to parse tags from column '${col}':`, e.message);
                      console.warn('Original value:', row[col]);
                    }
                  }
                }
                
                // Find and parse metadata
                for (const col of possibleMetadataColumns) {
                  if (row[col] !== undefined) {
                    try {
                      let value = row[col];
                      if (value && value !== '' && value !== 'null' && value !== null) {
                        // Remove surrounding quotes if present
                        if (typeof value === 'string') {
                          // Remove leading/trailing single or double quotes
                          value = value.trim();
                          if ((value.startsWith("'") && value.endsWith("'")) || 
                              (value.startsWith('"') && value.endsWith('"'))) {
                            value = value.slice(1, -1);
                          }
                        }
                        metadata = typeof value === 'string' ? JSON.parse(value) : value;
                      }
                      delete baseFields[col];
                      break;
                    } catch (e) {
                      console.warn(`Row ${index}: Failed to parse metadata from column '${col}':`, e.message);
                      console.warn('Original value:', row[col]);
                    }
                  }
                }
                
                // Log first few rows for debugging
                if (index < 3) {
                  console.log(`Processed row ${index}:`, {
                    accountid: baseFields.accountid,
                    service: baseFields.service,
                    tags: tags,
                    metadata: metadata,
                    tagCount: Object.keys(tags).length,
                    metadataCount: Object.keys(metadata).length
                  });
                }
                
                return {
                  ...baseFields,
                  tags: tags || {},
                  metadata: metadata || {},
                  source_file: file.name,
                  upload_time: new Date().toISOString()
                };
              } catch (error) {
                console.error(`Error processing row ${index}:`, error);
                return null;
              }
            }).filter(row => row !== null); // Remove any failed rows
            
            console.log(`Successfully processed ${processedData.length} rows from ${file.name}`);
            
            resolve({
              fileName: file.name,
              fileSize: file.size,
              recordCount: processedData.length,
              data: processedData
            });
          },
          error: (error) => {
            console.error(`Error parsing ${file.name}:`, error);
            reject(error);
          }
        });
      });
    });

    Promise.all(filePromises)
      .then((results) => {
        const newLoadedFiles = results.map(({ fileName, fileSize, recordCount }) => ({
          name: fileName,
          size: fileSize,
          records: recordCount,
          uploadTime: new Date()
        }));
        
        const newData = results.flatMap(result => result.data);
        
        console.log('Total resources loaded:', newData.length);
        
        setLoadedFiles(prev => [...prev, ...newLoadedFiles]);
        setData(prev => [...prev, ...newData]);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error processing files:', error);
        alert('Error loading CSV file. Please check the console for details.');
        setIsLoading(false);
      });
    
    // Reset file input
    event.target.value = '';
  }, []);

  const removeFile = useCallback((fileName) => {
    setData(prev => prev.filter(item => item.source_file !== fileName));
    setLoadedFiles(prev => prev.filter(file => file.name !== fileName));
  }, []);

  const clearAllFiles = useCallback(() => {
    setData([]);
    setLoadedFiles([]);
    setSelectedFile('all');
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesAccount = selectedAccount === 'all' || item.accountid === selectedAccount;
      const matchesRegion = selectedRegion === 'all' || item.region === selectedRegion;
      const matchesFile = selectedFile === 'all' || item.source_file === selectedFile;
      const matchesSearch = searchTerm === '' || 
        item.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(item.tags).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || 
        SERVICE_CATEGORIES[selectedCategory]?.includes(item.service);
      
      return matchesAccount && matchesRegion && matchesFile && matchesSearch && matchesCategory;
    });
  }, [data, selectedAccount, selectedRegion, selectedFile, searchTerm, selectedCategory]);

  const accounts = useMemo(() => [...new Set(data.map(item => item.accountid))], [data]);
  const regions = useMemo(() => [...new Set(data.map(item => item.region))], [data]);

  const resourcesByService = useMemo(() => {
    const grouped = _.groupBy(filteredData, 'service');
    return Object.entries(grouped).map(([service, items]) => ({
      service,
      count: items.length,
      accounts: [...new Set(items.map(i => i.accountid))].length,
      regions: [...new Set(items.map(i => i.region))].length
    })).sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const resourcesByRegion = useMemo(() => {
    const grouped = _.groupBy(filteredData, 'region');
    return Object.entries(grouped).map(([region, items]) => ({
      region,
      name: AWS_REGIONS[region]?.name || region,
      count: items.length,
      lat: AWS_REGIONS[region]?.lat || 0,
      lng: AWS_REGIONS[region]?.lng || 0
    }));
  }, [filteredData]);

  const resourcesByAccount = useMemo(() => {
    const grouped = _.groupBy(filteredData, 'accountid');
    return Object.entries(grouped).map(([account, items]) => ({
      account,
      count: items.length,
      services: [...new Set(items.map(i => i.service))].length
    }));
  }, [filteredData]);

  const categoryDistribution = useMemo(() => {
    const distribution = {};
    Object.entries(SERVICE_CATEGORIES).forEach(([category, services]) => {
      distribution[category] = filteredData.filter(item => 
        services.includes(item.service)
      ).length;
    });
    
    return Object.entries(distribution)
      .filter(([_, count]) => count > 0)
      .map(([category, count]) => ({ category, count }));
  }, [filteredData]);

  const tagAnalysis = useMemo(() => {
    const tagCounts = {};
    let debugInfo = { totalTags: 0, resourcesWithTags: 0 };
    
    filteredData.forEach(item => {
      const tags = item.tags || {};
      if (Object.keys(tags).length > 0) {
        debugInfo.resourcesWithTags++;
        Object.keys(tags).forEach(tag => {
          debugInfo.totalTags++;
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    // Log debug info if no tags found
    if (debugInfo.totalTags === 0 && filteredData.length > 0) {
      console.log('No tags found. Debug info:', debugInfo);
      console.log('First resource:', filteredData[0]);
    }
    
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredData]);

  const exportData = () => {
    const exportableData = filteredData.map(item => {
      const { tags, metadata, ...rest } = item;
      return {
        ...rest,
        tags_json: tags && Object.keys(tags).length > 0 ? JSON.stringify(tags) : '',
        metadata_json: metadata && Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : ''
      };
    });
    
    const csv = Papa.unparse(exportableData);
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aws-inventory-combined-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <Server className="w-8 h-8 opacity-80" />
          <span className="text-3xl font-bold">{filteredData.length}</span>
        </div>
        <h3 className="text-lg font-semibold">Total Resources</h3>
        <p className="text-sm opacity-80 mt-1">Across all accounts</p>
      </div>
      
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <Grid3X3 className="w-8 h-8 opacity-80" />
          <span className="text-3xl font-bold">{accounts.length}</span>
        </div>
        <h3 className="text-lg font-semibold">AWS Accounts</h3>
        <p className="text-sm opacity-80 mt-1">Multi-account view</p>
      </div>
      
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <Map className="w-8 h-8 opacity-80" />
          <span className="text-3xl font-bold">{regions.length}</span>
        </div>
        <h3 className="text-lg font-semibold">Active Regions</h3>
        <p className="text-sm opacity-80 mt-1">Global distribution</p>
      </div>
      
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <Cloud className="w-8 h-8 opacity-80" />
          <span className="text-3xl font-bold">{resourcesByService.length}</span>
        </div>
        <h3 className="text-lg font-semibold">AWS Services</h3>
        <p className="text-sm opacity-80 mt-1">In use</p>
      </div>
    </div>
  );

  const renderHeatMap = () => {
    const [hoveredRegion, setHoveredRegion] = useState(null);
    const maxCount = Math.max(...resourcesByRegion.map(r => r.count));
    
    // Convert lat/lng to percentage positions on the map
    const getMapPosition = (lat, lng) => {
      // Convert longitude (-180 to 180) to percentage (0 to 100)
      const x = ((lng + 180) / 360) * 100;
      // Convert latitude (90 to -90) to percentage (0 to 100) 
      const y = ((90 - lat) / 180) * 100;
      return { x, y };
    };
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Map className="w-6 h-6" />
          Regional Resource Distribution
        </h3>
        
        <div className="relative">
          {/* World Map Container */}
          <div className="relative bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg overflow-hidden">
            {/* Use a gradient background to simulate ocean */}
            <div 
              className="relative w-full h-[500px]"
              style={{
                backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500"><defs><pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="1000" height="500" fill="%23E0E7FF"/><rect width="1000" height="500" fill="url(%23grid)"/></svg>')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Simple World Map SVG Overlay */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 500">
                {/* Continents - simplified but more realistic shapes */}
                <g fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="1">
                  {/* North America */}
                  <path d="M 150 120 C 180 100, 220 90, 260 95 L 280 110 L 290 130 C 280 150, 260 160, 240 155 L 200 170 C 180 165, 160 150, 150 130 Z M 180 170 L 200 180 L 220 190 L 240 200 C 230 220, 210 230, 190 225 L 180 210 Z" />
                  
                  {/* South America */}
                  <path d="M 230 250 C 240 240, 250 250, 260 270 L 265 320 C 260 350, 250 380, 240 390 C 230 380, 225 350, 220 320 L 225 280 Z" />
                  
                  {/* Europe */}
                  <path d="M 470 110 C 490 105, 510 110, 520 120 L 515 130 C 500 135, 490 130, 480 125 Z M 480 135 L 490 140 L 510 150 C 505 160, 495 165, 485 160 Z" />
                  
                  {/* Africa */}
                  <path d="M 480 200 C 490 180, 510 170, 520 180 L 525 220 L 510 260 C 500 280, 490 290, 480 285 L 470 250 Z" />
                  
                  {/* Asia */}
                  <path d="M 550 100 C 600 95, 650 100, 700 110 L 730 140 C 720 160, 700 170, 680 165 L 620 155 L 570 140 Z M 600 160 L 620 170 L 650 190 C 645 200, 630 205, 610 200 Z" />
                  
                  {/* Australia */}
                  <path d="M 720 320 C 740 315, 760 320, 770 330 L 765 340 C 750 345, 730 340, 720 330 Z" />
                </g>
              </svg>
              
              {/* AWS Region Bubbles */}
              {resourcesByRegion.map((region, idx) => {
                const position = getMapPosition(region.lat, region.lng);
                const scaleFactor = Math.sqrt(region.count / maxCount);
                const size = scaleFactor * 80 + 20; // Bubble size in pixels
                const isHovered = hoveredRegion === region.region;
                
                return (
                  <div
                    key={region.region}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                      width: `${size}px`,
                      height: `${size}px`
                    }}
                    onMouseEnter={() => setHoveredRegion(region.region)}
                    onMouseLeave={() => setHoveredRegion(null)}
                  >
                    {/* Bubble with multiple layers for 3D effect */}
                    <div className="relative w-full h-full">
                      {/* Shadow */}
                      <div
                        className="absolute inset-0 rounded-full bg-black opacity-20 blur-sm"
                        style={{ transform: 'translate(2px, 2px)' }}
                      />
                      
                      {/* Outer glow */}
                      <div
                        className={`absolute -inset-2 rounded-full ${isHovered ? 'animate-pulse' : ''}`}
                        style={{
                          backgroundColor: COLORS[idx % COLORS.length],
                          opacity: 0.3
                        }}
                      />
                      
                      {/* Main bubble */}
                      <div
                        className="absolute inset-0 rounded-full transition-all duration-300 cursor-pointer"
                        style={{
                          backgroundColor: COLORS[idx % COLORS.length],
                          opacity: 0.9,
                          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                          border: '2px solid white',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                      />
                      
                      {/* Inner highlight for 3D effect */}
                      <div
                        className="absolute rounded-full bg-white opacity-30"
                        style={{
                          width: '60%',
                          height: '60%',
                          top: '10%',
                          left: '10%'
                        }}
                      />
                      
                      {/* Count text */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-bold" style={{ fontSize: size > 40 ? '14px' : '11px' }}>
                          {region.count.toLocaleString()}
                        </span>
                      </div>
                      
                      {/* Region label */}
                      {isHovered && (
                        <div
                          className="absolute left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded text-sm whitespace-nowrap"
                          style={{ top: `${size + 10}px` }}
                        >
                          {region.name}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Hover details panel */}
          {hoveredRegion && (
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-xl p-4 border border-gray-200">
              <div className="font-semibold text-lg text-gray-900">
                {resourcesByRegion.find(r => r.region === hoveredRegion)?.name}
              </div>
              <div className="text-sm text-gray-500 mb-2">
                {hoveredRegion}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">
                  {resourcesByRegion.find(r => r.region === hoveredRegion)?.count.toLocaleString()}
                </span>
                <span className="text-sm text-gray-600">resources</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Legend and Statistics */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Size Legend */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Bubble Size Reference</h4>
            <div className="flex items-center justify-around">
              {[10, 100, 1000, 5000].map((size, idx) => (
                <div key={size} className="flex flex-col items-center gap-2">
                  <div
                    className="rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{
                      width: Math.sqrt(size / 5000) * 50 + 15 + 'px',
                      height: Math.sqrt(size / 5000) * 50 + 15 + 'px',
                      backgroundColor: COLORS[3],
                      opacity: 0.8,
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {size >= 1000 ? `${size/1000}k` : size}
                  </div>
                  <span className="text-xs text-gray-600">{size.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Top Regions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Top 5 Regions</h4>
            <div className="space-y-2">
              {resourcesByRegion
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map((region, idx) => (
                  <div key={region.region} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: COLORS[resourcesByRegion.indexOf(region) % COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-gray-700">{region.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{region.count.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="text-xs font-medium opacity-90">Active Regions</div>
              <div className="text-3xl font-bold">{resourcesByRegion.length}</div>
              <div className="text-xs opacity-80">AWS regions</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="text-xs font-medium opacity-90">Total Resources</div>
              <div className="text-3xl font-bold">
                {resourcesByRegion.reduce((sum, r) => sum + r.count, 0).toLocaleString()}
              </div>
              <div className="text-xs opacity-80">Globally</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderServiceBreakdown = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6">Resources by Service</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={resourcesByService.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="service" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#4ECDC4" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6">Category Distribution</h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={categoryDistribution}
              cx="50%"
              cy="50%"
              outerRadius={120}
              dataKey="count"
              label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
            >
              {categoryDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderTagAnalysis = () => {
    // Debug info
    const totalResourcesWithTags = filteredData.filter(item => 
      item.tags && Object.keys(item.tags).length > 0
    ).length;
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Tag className="w-6 h-6" />
          Tag Usage Analysis
        </h3>
        
        {/* Debug info */}
        {totalResourcesWithTags === 0 && filteredData.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <AlertCircle className="inline w-4 h-4 mr-1" />
              No tags found in {filteredData.length} resources. 
              {filteredData.length > 0 && (
                <span> Check console for data sample.</span>
              )}
            </p>
            <button
              onClick={() => {
                console.log('Sample resource data:');
                filteredData.slice(0, 3).forEach((item, idx) => {
                  console.log(`Resource ${idx + 1}:`, item);
                  console.log(`Tags:`, item.tags);
                  console.log(`Metadata:`, item.metadata);
                });
              }}
              className="mt-2 text-xs text-yellow-700 underline"
            >
              Log sample data to console
            </button>
          </div>
        )}
        
        {tagAnalysis.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tagAnalysis} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="tag" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#96CEB4" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Tag Coverage</h4>
              <div className="space-y-2">
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">{totalResourcesWithTags}</span> of{' '}
                    <span className="font-semibold">{filteredData.length}</span> resources have tags
                    {totalResourcesWithTags > 0 && (
                      <span className="text-green-600 ml-2">
                        ({((totalResourcesWithTags / filteredData.length) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
                {tagAnalysis.slice(0, 5).map((tag, idx) => (
                  <div key={tag.tag} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{tag.tag}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                          style={{ width: `${(tag.count / filteredData.length * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {((tag.count / filteredData.length) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No tag data available</p>
            {filteredData.length > 0 && (
              <p className="text-sm mt-2">Resources loaded but no tags found</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCategoryDetails = () => {
    const categoryResources = filteredData.filter(item => 
      SERVICE_CATEGORIES[activeCategory]?.includes(item.service)
    );
    
    const groupedByService = _.groupBy(categoryResources, 'service');
    
    const categoryIcons = {
      compute: <Server className="w-5 h-5" />,
      storage: <Database className="w-5 h-5" />,
      networking: <Network className="w-5 h-5" />,
      serverless: <Zap className="w-5 h-5" />,
      security: <Shield className="w-5 h-5" />,
      analytics: <BarChart3 className="w-5 h-5" />,
      ml: <TrendingUp className="w-5 h-5" />,
      devops: <Cloud className="w-5 h-5" />,
      database: <Database className="w-5 h-5" />
    };
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6">Category Resource Details</h3>
        
        {/* Category Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-4 overflow-x-auto">
            {Object.keys(SERVICE_CATEGORIES).map(category => {
              const count = filteredData.filter(item => 
                SERVICE_CATEGORIES[category]?.includes(item.service)
              ).length;
              
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`
                    whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                    ${activeCategory === category 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {categoryIcons[category]}
                  <span className="capitalize">{category}</span>
                  <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                    activeCategory === category 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Category Content */}
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium">Total Resources</div>
              <div className="text-2xl font-bold text-blue-900">{categoryResources.length}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-medium">Services Used</div>
              <div className="text-2xl font-bold text-purple-900">{Object.keys(groupedByService).length}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium">Accounts</div>
              <div className="text-2xl font-bold text-green-900">
                {[...new Set(categoryResources.map(r => r.accountid))].length}
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
              <div className="text-sm text-orange-600 font-medium">Regions</div>
              <div className="text-2xl font-bold text-orange-900">
                {[...new Set(categoryResources.map(r => r.region))].length}
              </div>
            </div>
          </div>
          
          {/* Resources by Service */}
          {Object.entries(groupedByService).map(([service, resources]) => (
            <div key={service} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {service}
                  </span>
                  <span className="text-sm text-gray-500">{resources.length} resources</span>
                </h4>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{[...new Set(resources.map(r => r.accountid))].length} accounts</span>
                  <span>•</span>
                  <span>{[...new Set(resources.map(r => r.region))].length} regions</span>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {resources.slice(0, 10).map((resource, idx) => (
                  <div key={idx} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-gray-900">{resource.resource_type}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 mr-2">
                            {resource.accountid}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {AWS_REGIONS[resource.region]?.name || resource.region}
                          </span>
                          {loadedFiles.length > 1 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 ml-2" title={resource.source_file}>
                              <FileText className="w-3 h-3 mr-1" />
                              {resource.source_file.length > 15 ? '...' + resource.source_file.slice(-12) : resource.source_file}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    {Object.keys(resource.tags || {}).length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-gray-600 mb-1">Tags:</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(resource.tags).map(([key, value]) => (
                            <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
                              <span className="font-medium">{key}:</span> {value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Metadata */}
                    {Object.keys(resource.metadata || {}).length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-gray-600 mb-1">Metadata:</div>
                        <div className="bg-gray-50 rounded p-2 text-xs">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            {Object.entries(resource.metadata).slice(0, 6).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-gray-600">{key}:</span>
                                <span className="text-gray-900 font-medium ml-2">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                          {Object.keys(resource.metadata).length > 6 && (
                            <div className="text-gray-500 mt-1">
                              +{Object.keys(resource.metadata).length - 6} more properties
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {resources.length > 10 && (
                  <div className="px-4 py-3 bg-gray-50 text-center text-sm text-gray-500">
                    Showing 10 of {resources.length} {service} resources
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {categoryResources.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No resources found in the {activeCategory} category
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResourceTable = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold mb-6">Resource Details</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
              {loadedFiles.length > 1 && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.slice(0, 50).map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.accountid}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.region}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.service}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.resource_type}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(item.tags || {}).slice(0, 3).map(([key, value]) => (
                      <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {key}: {value}
                      </span>
                    ))}
                    {Object.keys(item.tags || {}).length > 3 && (
                      <span className="text-xs text-gray-400">+{Object.keys(item.tags).length - 3} more</span>
                    )}
                  </div>
                </td>
                {loadedFiles.length > 1 && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700" title={item.source_file}>
                      {item.source_file.length > 20 ? '...' + item.source_file.slice(-17) : item.source_file}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredData.length > 50 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing 50 of {filteredData.length} resources
          </div>
        )}
      </div>
    </div>
  );

  const renderFiles = () => (
    <div className="space-y-6">
      {/* File Upload Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Files className="w-6 h-6" />
          File Management
        </h3>
        
        {loadedFiles.length === 0 ? (
          <div className="text-center py-12">
            <Files className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-6">No files loaded yet</p>
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 cursor-pointer transition-all">
              <Upload className="w-5 h-5" />
              Upload CSV Files
              <input
                type="file"
                accept=".csv"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {loadedFiles.map((file) => (
                <div key={file.name} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <h4 className="font-medium text-gray-900 truncate" title={file.name}>
                          {file.name}
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Records:</span>
                          <span className="ml-2 font-medium text-gray-900">{file.records.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Size:</span>
                          <span className="ml-2 font-medium text-gray-900">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Uploaded:</span>
                          <span className="ml-2 font-medium text-gray-900">{new Date(file.uploadTime).toLocaleTimeString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <span className="ml-2 font-medium text-gray-900">{new Date(file.uploadTime).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(file.name)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Remove file"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-gray-600">
                Total: <span className="font-semibold text-gray-900">{data.length.toLocaleString()}</span> resources from {loadedFiles.length} file{loadedFiles.length > 1 ? 's' : ''}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={clearAllFiles}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Files
                </button>
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  Add More Files
                  <input
                    type="file"
                    accept=".csv"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* File Statistics */}
      {loadedFiles.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">File Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={loadedFiles.map(file => ({ name: file.name.split('.')[0], value: file.records }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {loadedFiles.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="col-span-2">
              <h4 className="font-medium text-gray-700 mb-3">Resources by File</h4>
              <div className="space-y-2">
                {loadedFiles.map((file, idx) => {
                  const percentage = (file.records / data.length) * 100;
                  return (
                    <div key={file.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 truncate max-w-xs" title={file.name}>
                            {file.name}
                          </span>
                          <span className="font-medium text-gray-900">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: COLORS[idx % COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-lg">
                <Cloud className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AWS Multi-Account Inventory</h1>
                <p className="text-sm text-gray-500">Rackspace Cloud Intelligence Platform</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {loadedFiles.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {loadedFiles.length} file{loadedFiles.length > 1 ? 's' : ''} loaded
                  </span>
                  <button
                    onClick={clearAllFiles}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear all
                  </button>
                </div>
              )}
              
              {data.length > 0 && (
                <button
                  onClick={exportData}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              )}
              
              <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 cursor-pointer transition-all">
                <Upload className="w-4 h-4" />
                Upload CSV{loadedFiles.length > 0 ? 's' : ''}
                <input
                  type="file"
                  accept=".csv"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Cloud className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No inventory data loaded</h2>
            <p className="text-gray-500 mb-6">Upload one or more AWS inventory CSV files to get started</p>
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 cursor-pointer transition-all">
              <Upload className="w-5 h-5" />
              Upload Inventory CSV Files
              <input
                type="file"
                accept=".csv"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-400 mt-4">You can select multiple CSV files at once</p>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
              <nav className="flex space-x-1 p-2 overflow-x-auto">
                <button
                  onClick={() => setSelectedView('overview')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                    selectedView === 'overview'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Overview
                </button>
                
                <button
                  onClick={() => setSelectedView('heatmap')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                    selectedView === 'heatmap'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Map className="w-4 h-4" />
                  Heat Map
                </button>
                
                <button
                  onClick={() => setSelectedView('services')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                    selectedView === 'services'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Cloud className="w-4 h-4" />
                  Services
                </button>
                
                <button
                  onClick={() => setSelectedView('categories')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                    selectedView === 'categories'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Categories
                </button>
                
                <button
                  onClick={() => setSelectedView('tags')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                    selectedView === 'tags'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Tag className="w-4 h-4" />
                  Tags
                </button>
                
                <button
                  onClick={() => setSelectedView('table')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                    selectedView === 'table'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  Resources
                </button>
                
                <button
                  onClick={() => setSelectedView('files')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                    selectedView === 'files'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Files className="w-4 h-4" />
                  Files
                  {loadedFiles.length > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                      selectedView === 'files' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {loadedFiles.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div className="relative xl:col-span-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Accounts</option>
                  {accounts.map(account => (
                    <option key={account} value={account}>{account}</option>
                  ))}
                </select>
                
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Regions</option>
                  {regions.map(region => (
                    <option key={region} value={region}>
                      {AWS_REGIONS[region]?.name || region}
                    </option>
                  ))}
                </select>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {Object.keys(SERVICE_CATEGORIES).map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
                
                {loadedFiles.length > 1 && (
                  <select
                    value={selectedFile}
                    onChange={(e) => setSelectedFile(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Files</option>
                    {loadedFiles.map(file => (
                      <option key={file.name} value={file.name}>
                        {file.name.length > 20 ? '...' + file.name.slice(-17) : file.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Dynamic Content Based on View */}
            {selectedView === 'overview' && (
              <>
                {renderOverview()}
                {renderServiceBreakdown()}
              </>
            )}
            
            {selectedView === 'heatmap' && renderHeatMap()}
            
            {selectedView === 'services' && renderServiceBreakdown()}
            
            {selectedView === 'categories' && renderCategoryDetails()}
            
            {selectedView === 'tags' && renderTagAnalysis()}
            
            {selectedView === 'table' && renderResourceTable()}
            
            {selectedView === 'files' && renderFiles()}

            {/* Account Comparison */}
            {selectedView === 'overview' && (
              <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-6">Account Comparison</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={resourcesByAccount}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="account" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#FF6B6B" name="Resources" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="services" fill="#4ECDC4" name="Services" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Insights Panel */}
            <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Quick Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-700 mb-2">Most Used Service</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {resourcesByService[0]?.service || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">{resourcesByService[0]?.count || 0} resources</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-700 mb-2">Primary Region</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {resourcesByRegion[0]?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">{resourcesByRegion[0]?.count || 0} resources</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-700 mb-2">Tag Coverage</h4>
                  <p className="text-2xl font-bold text-purple-600">
                    {((filteredData.filter(item => Object.keys(item.tags || {}).length > 0).length / filteredData.length) * 100).toFixed(0)}%
                  </p>
                  <p className="text-sm text-gray-500">Resources tagged</p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
