export const navTabs = [
  "Overview",
  "Activity",
  "Manage",
  "Program",
  "Folders",
  "Documents",
];

export const folders = [
  { title: "Add New Folder", count: null, subtitle: null, accent: "bg-slate-100" },
  { title: "My Portfolio", count: 54, subtitle: "Files", accent: "bg-white" },
  { title: "Client Projects", count: 87, subtitle: "Files", accent: "bg-white" },
  { title: "Creative Assets", count: 102, subtitle: "Files", accent: "bg-white" },
  { title: "Work Documents", count: 12, subtitle: "Files", accent: "bg-white" },
  { title: "Product Designs", count: 36, subtitle: "Files", accent: "bg-white" },
];

export const boardTabs = ["Board", "Timeline", "Spreadsheet", "Calendar"];

export const boardColumns = [
  {
    title: "Not Started",
    count: 3,
    accent: "border-slate-200",
    tasks: [
      {
        title: "Pillo Website and App",
        subtitle: "New Design",
        priority: "Low",
        due: "March 30, 2025",
        progress: 0,
        color: "bg-emerald-400",
      },
      {
        title: "Lambo Consultancy Website",
        subtitle: "New Homepage",
        priority: "Medium",
        due: "April 02, 2025",
        progress: 0,
        color: "bg-amber-400",
      },
    ],
  },
  {
    title: "In Progress",
    count: 4,
    accent: "border-rose-200",
    tasks: [
      {
        title: "Orbito Pharmacy Website",
        subtitle: "New Homepage",
        priority: "High",
        due: "March 29, 2025",
        progress: 35,
        color: "bg-rose-500",
      },
      {
        title: "Tarbo App and Website",
        subtitle: "New Project",
        priority: "Low",
        due: "April 05, 2025",
        progress: 20,
        color: "bg-emerald-400",
      },
    ],
  },
  {
    title: "Under Review",
    count: 3,
    accent: "border-sky-200",
    tasks: [
      {
        title: "Ebay Website Development",
        subtitle: "New E-commerce",
        priority: "Low",
        due: "March 21, 2025",
        progress: 60,
        color: "bg-sky-500",
      },
      {
        title: "Filio Webapp Design",
        subtitle: "New Webapp",
        priority: "Medium",
        due: "April 01, 2025",
        progress: 40,
        color: "bg-amber-400",
      },
    ],
  },
  {
    title: "Completed",
    count: 5,
    accent: "border-emerald-200",
    tasks: [
      {
        title: "Update Design System",
        subtitle: "New Design",
        priority: "Medium",
        due: "March 16, 2025",
        progress: 100,
        color: "bg-emerald-500",
      },
      {
        title: "AI Travel App Design",
        subtitle: "App Design",
        priority: "High",
        due: "March 12, 2025",
        progress: 100,
        color: "bg-rose-500",
      },
    ],
  },
];
