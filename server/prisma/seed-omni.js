import { getPrismaClient, disconnectPrisma } from '../src/lib/database.js';

const prisma = getPrismaClient();

async function main() {
  console.log('Seeding Omni-Composer System Data...');

  // 1. System Actions (!)
  const actions = [
    {
      trigger: 'save',
      label: 'Save Note',
      subLabel: 'Save to Vault',
      description: 'Persist the current conversation as a note',
      actionCode: 'save',
      icon: 'save'
    },
    {
      trigger: 'broadcast',
      label: 'Broadcast',
      subLabel: 'Post to Feed',
      description: 'Share this conversation to your public feed',
      actionCode: 'broadcast',
      icon: 'globe'
    },
    {
      trigger: 'verify',
      label: 'Verify',
      subLabel: 'Fact Check',
      description: 'Run a verification pass on the last message',
      actionCode: 'verify',
      icon: 'check-circle' // Mapped to 'check-circle' or fallback
    },
    {
      trigger: 'summarize',
      label: 'Summarize',
      subLabel: 'TL;DR',
      description: 'Generate a summary of the conversation',
      actionCode: 'summarize',
      icon: 'file-text'
    }
  ];

  for (const action of actions) {
    await prisma.systemAction.upsert({
      where: { trigger: action.trigger },
      update: action,
      create: action
    });
  }
  console.log(`Seeded ${actions.length} System Actions`);

  // 2. System Commands (/)
  const commands = [
    {
      trigger: 'clear',
      label: 'Clear Chat',
      subLabel: 'Reset Context',
      description: 'Clear the current conversation history',
      actionCode: 'clear',
      icon: 'trash-2',
      scope: 'chat'
    },
    {
      trigger: 'settings',
      label: 'Settings',
      subLabel: 'Configure AI',
      description: 'Open the settings modal',
      actionCode: 'settings',
      icon: 'settings',
      scope: 'global'
    },
    {
      trigger: 'model',
      label: 'Switch Model',
      subLabel: 'Change AI Provider',
      description: 'Select a different AI model',
      actionCode: 'switch_model',
      icon: 'cpu',
      scope: 'chat'
    },
    {
      trigger: 'help',
      label: 'Help',
      subLabel: 'Documentation',
      description: 'Show help and shortcuts',
      actionCode: 'help',
      icon: 'help-circle',
      scope: 'global'
    }
  ];

  for (const command of commands) {
    await prisma.systemCommand.upsert({
      where: { trigger: command.trigger },
      update: command,
      create: command
    });
  }
  console.log(`Seeded ${commands.length} System Commands`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectPrisma();
  });
