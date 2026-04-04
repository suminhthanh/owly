import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/owly?schema=public";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create default settings
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      businessName: "My Business",
      businessDesc: "We provide excellent products and services.",
      welcomeMessage: "Hello! Welcome to our support. How can I help you today?",
      tone: "friendly",
      language: "auto",
    },
  });

  // Create default channels
  const channels = ["whatsapp", "email", "phone"];
  for (const type of channels) {
    await prisma.channel.upsert({
      where: { type },
      update: {},
      create: { type, isActive: false, status: "disconnected" },
    });
  }

  // Create sample departments
  const techDept = await prisma.department.create({
    data: {
      name: "Technical Support",
      description: "Handles technical issues, bugs, and product troubleshooting",
      email: "tech@example.com",
    },
  });

  const salesDept = await prisma.department.create({
    data: {
      name: "Sales",
      description: "Handles pricing, quotes, and purchase inquiries",
      email: "sales@example.com",
    },
  });

  const billingDept = await prisma.department.create({
    data: {
      name: "Billing",
      description: "Handles invoices, payments, and refunds",
      email: "billing@example.com",
    },
  });

  // Create sample team members
  await prisma.teamMember.createMany({
    data: [
      {
        name: "John Smith",
        email: "john@example.com",
        role: "Lead",
        expertise: "software, debugging, API issues",
        departmentId: techDept.id,
      },
      {
        name: "Sarah Johnson",
        email: "sarah@example.com",
        role: "Member",
        expertise: "networking, infrastructure, deployment",
        departmentId: techDept.id,
      },
      {
        name: "Mike Davis",
        email: "mike@example.com",
        role: "Lead",
        expertise: "pricing, enterprise deals, partnerships",
        departmentId: salesDept.id,
      },
      {
        name: "Emily Brown",
        email: "emily@example.com",
        role: "Lead",
        expertise: "invoices, refunds, payment processing",
        departmentId: billingDept.id,
      },
    ],
  });

  // Create sample knowledge base categories
  const faqCategory = await prisma.category.create({
    data: {
      name: "FAQ",
      description: "Frequently asked questions",
      icon: "help-circle",
      color: "#4A7C9B",
      sortOrder: 0,
    },
  });

  const productsCategory = await prisma.category.create({
    data: {
      name: "Products",
      description: "Product information and features",
      icon: "package",
      color: "#22C55E",
      sortOrder: 1,
    },
  });

  const policiesCategory = await prisma.category.create({
    data: {
      name: "Policies",
      description: "Return, refund, and shipping policies",
      icon: "shield",
      color: "#F59E0B",
      sortOrder: 2,
    },
  });

  // Create sample knowledge entries
  await prisma.knowledgeEntry.createMany({
    data: [
      {
        categoryId: faqCategory.id,
        title: "Business Hours",
        content:
          "We are open Monday to Friday, 9:00 AM to 6:00 PM. Our AI assistant is available 24/7 for basic inquiries.",
        priority: 10,
      },
      {
        categoryId: faqCategory.id,
        title: "Contact Information",
        content:
          "You can reach us via email at support@example.com, phone at +1-555-0123, or WhatsApp. Our AI assistant is always here to help!",
        priority: 9,
      },
      {
        categoryId: productsCategory.id,
        title: "Product Overview",
        content:
          "We offer a range of products designed to help businesses streamline their operations. Contact our sales team for detailed pricing and custom solutions.",
        priority: 5,
      },
      {
        categoryId: policiesCategory.id,
        title: "Return Policy",
        content:
          "We offer a 30-day return policy for all unused products in their original packaging. To initiate a return, please contact our support team with your order number.",
        priority: 8,
      },
      {
        categoryId: policiesCategory.id,
        title: "Refund Policy",
        content:
          "Refunds are processed within 5-10 business days after we receive the returned item. The refund will be credited to the original payment method.",
        priority: 7,
      },
    ],
  });

  // Create sample tags
  await prisma.tag.createMany({
    data: [
      { name: "Urgent", color: "#EF4444" },
      { name: "VIP", color: "#F59E0B" },
      { name: "Follow-up", color: "#3B82F6" },
      { name: "Resolved", color: "#22C55E" },
      { name: "Bug", color: "#8B5CF6" },
    ],
  });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
