import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Mail, Phone, MapPin } from 'lucide-react'
import { UserProfile, ProfileField, ProfileStats, UserListItem, TeamMembers } from './user-profile'

const meta: Meta<typeof UserProfile> = {
  title: 'Blocks/Application/UserProfile',
  component: UserProfile,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Sample user data
const sampleUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: 'https://github.com/shadcn.png',
  role: 'Senior Developer',
  department: 'Engineering',
  location: 'San Francisco, CA',
  phone: '+1 (555) 123-4567',
  website: 'https://johndoe.dev',
  bio: 'Full-stack developer with 8 years of experience in building scalable web applications. Passionate about clean code and user experience.',
  joinDate: '2020-01-15',
  status: 'active' as const,
  verified: true,
}

// Sample team members
const sampleTeamMembers = [
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    avatar: 'https://github.com/shadcn.png',
    role: 'Product Manager',
    status: 'online' as const,
  },
  {
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    avatar: 'https://github.com/shadcn.png',
    role: 'UX Designer',
    status: 'away' as const,
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    avatar: 'https://github.com/shadcn.png',
    role: 'Frontend Developer',
    status: 'offline' as const,
  },
  {
    name: 'Alex Brown',
    email: 'alex.brown@example.com',
    avatar: 'https://github.com/shadcn.png',
    role: 'Backend Developer',
    status: 'busy' as const,
  },
]

export const Default: Story = {
  args: {
    user: sampleUser,
    showActions: true,
    onEdit: () => {
      // Edit profile
    },
    onMessage: () => {
      // Send message
    },
    onViewActivity: () => {
      // View activity
    },
  },
}

export const WithoutActions: Story = {
  args: {
    user: sampleUser,
    showActions: false,
  },
}

export const WithoutAvatar: Story = {
  args: {
    user: {
      ...sampleUser,
      avatar: undefined,
    },
    showActions: true,
  },
}

export const WithoutBio: Story = {
  args: {
    user: {
      ...sampleUser,
      bio: undefined,
    },
    showActions: true,
  },
}

export const WithoutContactInfo: Story = {
  args: {
    user: {
      ...sampleUser,
    },
    showActions: true,
  },
}

export const InactiveUser: Story = {
  args: {
    user: {
      ...sampleUser,
      status: 'inactive' as const,
    },
    showActions: true,
  },
}

export const PendingUser: Story = {
  args: {
    user: {
      ...sampleUser,
      status: 'pending' as const,
      verified: false,
    },
    showActions: true,
  },
}

export const ProfileFieldExample: Story = {
  args: {
    user: sampleUser,
  },
  render: () => (
    <div className="space-y-4">
      <ProfileField
        icon={<Mail className="h-4 w-4" />}
        label="Email"
        value="john.doe@example.com"
        href="mailto:john.doe@example.com"
      />
      <ProfileField
        icon={<Phone className="h-4 w-4" />}
        label="Phone"
        value="+1 (555) 123-4567"
        href="tel:+15551234567"
      />
      <ProfileField
        icon={<MapPin className="h-4 w-4" />}
        label="Location"
        value="San Francisco, CA"
      />
    </div>
  ),
}

export const ProfileStatsExample: Story = {
  args: {
    user: sampleUser,
  },
  render: () => (
    <ProfileStats
      stats={[
        { label: 'Projects', value: 12 },
        { label: 'Tasks', value: 48 },
        { label: 'Contributions', value: 156 },
      ]}
    />
  ),
}

export const UserListItemExample: Story = {
  args: {
    user: sampleUser,
  },
  render: () => (
    <div className="space-y-4">
      <UserListItem
        user={sampleTeamMembers[0]}
        onSelect={() => {
          // Selected user
        }}
        showStatus
      />
      <UserListItem user={sampleTeamMembers[1]} selected showStatus />
      <UserListItem user={sampleTeamMembers[2]} showStatus />
    </div>
  ),
}

export const TeamMembersExample: Story = {
  args: {
    user: sampleUser,
  },
  render: () => (
    <TeamMembers
      members={sampleTeamMembers}
      title="Team Members"
      description="Your team members and their current status"
      onSelectMember={index => {
        // Selected member: index
      }}
      onViewAll={() => {
        // View all members
      }}
    />
  ),
}

export const WithLongContent: Story = {
  args: {
    user: {
      ...sampleUser,
      name: 'John Alexander William Doe',
      role: 'Senior Full Stack Software Engineer',
      department: 'Engineering and Product Development',
      bio: "This is a very long bio that might wrap to multiple lines. It contains detailed information about the user's experience, skills, and achievements. The bio should be properly formatted and aligned within the profile card.",
    },
    showActions: true,
  },
}

export const WithManyTeamMembers: Story = {
  args: {
    user: sampleUser,
  },
  render: () => (
    <TeamMembers
      members={[
        ...sampleTeamMembers,
        ...sampleTeamMembers.map(m => ({
          ...m,
          name: `${m.name} (2)`,
          email: m.email.replace('@', '2@'),
        })),
      ]}
      title="Large Team"
      description="A team with many members"
      onSelectMember={index => {
        // Selected member: index
      }}
      onViewAll={() => {
        // View all members
      }}
    />
  ),
}

export const WithoutStatus: Story = {
  args: {
    user: sampleUser,
  },
  render: () => (
    <div className="space-y-4">
      <UserListItem user={sampleTeamMembers[0]} showStatus={false} />
      <UserListItem user={sampleTeamMembers[1]} showStatus={false} />
    </div>
  ),
}

export const WithoutViewAll: Story = {
  args: {
    user: sampleUser,
  },
  render: () => (
    <TeamMembers
      members={sampleTeamMembers}
      title="Small Team"
      description="A team with all members visible"
      onSelectMember={index => {
        // Selected member: index
      }}
      showViewAll={false}
    />
  ),
}
