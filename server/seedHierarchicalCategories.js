import mongoose from "mongoose";
import CategoryModel from "./Models/Category.js";
import AdminModel from "./Models/Admin.js";

// Database connection
const connectString = 
    "mongodb+srv://Admin:admin@cluster0.26ccgyu.mongodb.net/WSH_group?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(connectString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Hierarchical categories structure
const hierarchicalCategories = {
  warranty: [
    {
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
      subcategories: [
        { name: 'Mobile Phones', description: 'Smartphones and feature phones' },
        { name: 'Laptops & Computers', description: 'Desktop and portable computers' },
        { name: 'Smart Devices', description: 'Smart home devices and IoT' },
        { name: 'Cameras', description: 'Digital cameras and accessories' },
        { name: 'Audio Equipment', description: 'Headphones, speakers, and sound systems' }
      ]
    },
    {
      name: 'Appliances',
      description: 'Home and kitchen appliances',
      subcategories: [
        { name: 'Kitchen Appliances', description: 'Microwaves, toasters, blenders' },
        { name: 'Refrigerators', description: 'Fridges and freezers' },
        { name: 'Washing Machines', description: 'Washers and dryers' },
        { name: 'Air Conditioners', description: 'AC units and climate control' },
        { name: 'Small Appliances', description: 'Coffee makers, kettles, etc.' }
      ]
    },
    {
      name: 'Furniture',
      description: 'Home and office furniture',
      subcategories: [
        { name: 'Living Room', description: 'Sofas, tables, entertainment units' },
        { name: 'Bedroom', description: 'Beds, wardrobes, dressers' },
        { name: 'Office Furniture', description: 'Desks, chairs, filing cabinets' },
        { name: 'Outdoor Furniture', description: 'Patio and garden furniture' }
      ]
    },
    {
      name: 'Vehicles',
      description: 'Cars, motorcycles, and other vehicles',
      subcategories: [
        { name: 'Cars', description: 'Automobiles and passenger vehicles' },
        { name: 'Motorcycles', description: 'Bikes and scooters' },
        { name: 'Bicycles', description: 'Pedal bikes and e-bikes' }
      ]
    }
  ],
  subscription: [
    {
      name: 'Entertainment',
      description: 'Streaming and media services',
      subcategories: [
        { name: 'Video Streaming', description: 'Netflix, Disney+, Prime Video' },
        { name: 'Music Streaming', description: 'Spotify, Apple Music' },
        { name: 'Gaming', description: 'PlayStation Plus, Xbox Game Pass' },
        { name: 'News & Magazines', description: 'Digital publications' }
      ]
    },
    {
      name: 'Productivity',
      description: 'Work and productivity tools',
      subcategories: [
        { name: 'Office Software', description: 'Microsoft 365, Google Workspace' },
        { name: 'Cloud Storage', description: 'Dropbox, iCloud, OneDrive' },
        { name: 'Design Tools', description: 'Adobe Creative Cloud, Canva' },
        { name: 'Project Management', description: 'Trello, Asana, Monday.com' }
      ]
    },
    {
      name: 'Education',
      description: 'Learning platforms',
      subcategories: [
        { name: 'Online Courses', description: 'Udemy, Coursera, LinkedIn Learning' },
        { name: 'Language Learning', description: 'Duolingo, Rosetta Stone' },
        { name: 'Skill Development', description: 'Skillshare, MasterClass' }
      ]
    },
    {
      name: 'Health & Fitness',
      description: 'Health and wellness',
      subcategories: [
        { name: 'Fitness Apps', description: 'Gym memberships, workout apps' },
        { name: 'Nutrition', description: 'Meal planning, diet tracking' },
        { name: 'Mental Health', description: 'Meditation, therapy apps' }
      ]
    }
  ],
  homeTask: [
    {
      name: 'Electrical',
      description: 'Electrical systems and maintenance',
      subcategories: [
        { name: 'Lighting', description: 'Bulbs, fixtures, switches' },
        { name: 'Wiring', description: 'Electrical wiring and circuits' },
        { name: 'Outlets & Switches', description: 'Power outlets and switches' }
      ]
    },
    {
      name: 'Plumbing',
      description: 'Water and drainage systems',
      subcategories: [
        { name: 'Pipes & Drains', description: 'Pipe repairs and drain cleaning' },
        { name: 'Faucets & Fixtures', description: 'Taps, sinks, showers' },
        { name: 'Water Heaters', description: 'Hot water systems' }
      ]
    },
    {
      name: 'HVAC',
      description: 'Heating, ventilation, and air conditioning',
      subcategories: [
        { name: 'Air Conditioning', description: 'AC maintenance and repair' },
        { name: 'Heating Systems', description: 'Furnaces and heaters' },
        { name: 'Ventilation', description: 'Air ducts and vents' }
      ]
    },
    {
      name: 'Appliance Maintenance',
      description: 'Home appliance servicing',
      subcategories: [
        { name: 'Refrigerator', description: 'Fridge maintenance' },
        { name: 'Washing Machine', description: 'Washer and dryer service' },
        { name: 'Dishwasher', description: 'Dishwasher maintenance' },
        { name: 'Stove & Oven', description: 'Cooking appliance service' }
      ]
    },
    {
      name: 'Home Exterior',
      description: 'Outdoor maintenance',
      subcategories: [
        { name: 'Landscaping', description: 'Lawn and garden care' },
        { name: 'Roof Maintenance', description: 'Roof inspection and repair' },
        { name: 'Gutters', description: 'Gutter cleaning and repair' },
        { name: 'Painting', description: 'Exterior and interior painting' }
      ]
    }
  ]
};

async function seedHierarchicalCategories() {
    try {
        console.log('🌱 Starting hierarchical category seeding...\n');

        // Find the super admin
        const superAdmin = await AdminModel.findOne({ accessName: 'admin' });
        
        if (!superAdmin) {
            console.log('❌ Super admin not found. Please create a super admin first.');
            console.log('   Run: node addAdmin.js');
            process.exit(1);
        }

        console.log(`✅ Found super admin: ${superAdmin.accessName}\n`);

        let parentCount = 0;
        let subcategoryCount = 0;
        let skippedCount = 0;

        // Seed each category type
        for (const [categoryType, parents] of Object.entries(hierarchicalCategories)) {
            console.log(`\n📦 Processing ${categoryType.toUpperCase()} categories...\n`);

            for (const parentData of parents) {
                // Check if parent exists
                let parentCategory = await CategoryModel.findOne({
                    name: parentData.name,
                    category: categoryType,
                    parentId: null
                });

                if (!parentCategory) {
                    // Create parent category
                    parentCategory = await CategoryModel.create({
                        name: parentData.name,
                        category: categoryType,
                        parentId: null,
                        description: parentData.description,
                        createdBy: superAdmin._id,
                        isActive: true
                    });
                    console.log(`  ✓ Created parent: ${parentData.name}`);
                    parentCount++;
                } else {
                    console.log(`  ⊝ Parent exists: ${parentData.name}`);
                    skippedCount++;
                }

                // Create subcategories
                if (parentData.subcategories) {
                    for (const subData of parentData.subcategories) {
                        const existingSub = await CategoryModel.findOne({
                            name: subData.name,
                            category: categoryType,
                            parentId: parentCategory._id
                        });

                        if (!existingSub) {
                            await CategoryModel.create({
                                name: subData.name,
                                category: categoryType,
                                parentId: parentCategory._id,
                                description: subData.description,
                                createdBy: superAdmin._id,
                                isActive: true
                            });
                            console.log(`    ↳ Created subcategory: ${subData.name}`);
                            subcategoryCount++;
                        } else {
                            console.log(`    ⊝ Subcategory exists: ${subData.name}`);
                            skippedCount++;
                        }
                    }
                }
            }
        }

        console.log('\n🎉 Hierarchical category seeding completed!');
        console.log(`   📊 Summary:`);
        console.log(`      - Parent categories added: ${parentCount}`);
        console.log(`      - Subcategories added: ${subcategoryCount}`);
        console.log(`      - Skipped (existing): ${skippedCount}`);
        console.log(`      - Total: ${parentCount + subcategoryCount + skippedCount} items processed`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding categories:', error);
        process.exit(1);
    }
}

// Run the seeder
seedHierarchicalCategories();
