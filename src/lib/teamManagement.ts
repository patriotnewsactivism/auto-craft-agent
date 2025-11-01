/**
 * Team Management Service
 * Manage teams, members, roles, and permissions
 */

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'developer' | 'viewer';
  status: 'active' | 'invited' | 'suspended';
  joinedAt: string;
  lastActive: string;
  permissions: string[];
}

export interface Team {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'enterprise';
  members: TeamMember[];
  projects: string[];
  createdAt: string;
  settings: TeamSettings;
}

export interface TeamSettings {
  allowInvites: boolean;
  requireApproval: boolean;
  defaultRole: 'developer' | 'viewer';
  maxMembers: number;
  features: {
    collaboration: boolean;
    aiAssistance: boolean;
    deployment: boolean;
    analytics: boolean;
  };
}

export interface Invitation {
  id: string;
  teamId: string;
  email: string;
  role: 'admin' | 'developer' | 'viewer';
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface Activity {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  type: 'member-joined' | 'member-left' | 'project-created' | 'deployment' | 'settings-changed';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const ROLE_PERMISSIONS = {
  owner: [
    'manage-team',
    'manage-members',
    'manage-billing',
    'manage-projects',
    'deploy',
    'edit-code',
    'view-code',
    'view-analytics',
  ],
  admin: [
    'manage-members',
    'manage-projects',
    'deploy',
    'edit-code',
    'view-code',
    'view-analytics',
  ],
  developer: [
    'manage-projects',
    'deploy',
    'edit-code',
    'view-code',
  ],
  viewer: [
    'view-code',
  ],
};

class TeamManagementService {
  private teams: Map<string, Team> = new Map();
  private invitations: Map<string, Invitation> = new Map();
  private activities: Activity[] = [];
  private currentUserId: string = 'user-1'; // In real app, from auth

  constructor() {
    this.initializeDemoData();
  }

  /**
   * Initialize with demo data
   */
  private initializeDemoData(): void {
    const demoTeam: Team = {
      id: 'team-1',
      name: 'My Awesome Team',
      description: 'Building amazing things together',
      plan: 'pro',
      members: [
        {
          id: 'user-1',
          name: 'You',
          email: 'you@example.com',
          role: 'owner',
          status: 'active',
          joinedAt: '2024-01-15',
          lastActive: new Date().toISOString(),
          permissions: ROLE_PERMISSIONS.owner,
        },
        {
          id: 'user-2',
          name: 'Alice Developer',
          email: 'alice@example.com',
          role: 'developer',
          status: 'active',
          joinedAt: '2024-02-20',
          lastActive: '2024-11-01T10:30:00Z',
          permissions: ROLE_PERMISSIONS.developer,
        },
        {
          id: 'user-3',
          name: 'Bob Viewer',
          email: 'bob@example.com',
          role: 'viewer',
          status: 'active',
          joinedAt: '2024-03-10',
          lastActive: '2024-10-31T15:45:00Z',
          permissions: ROLE_PERMISSIONS.viewer,
        },
      ],
      projects: ['project-1', 'project-2', 'project-3'],
      createdAt: '2024-01-15',
      settings: {
        allowInvites: true,
        requireApproval: false,
        defaultRole: 'developer',
        maxMembers: 10,
        features: {
          collaboration: true,
          aiAssistance: true,
          deployment: true,
          analytics: true,
        },
      },
    };

    this.teams.set(demoTeam.id, demoTeam);
    
    // Add some activities
    this.activities.push(
      {
        id: 'activity-1',
        teamId: 'team-1',
        userId: 'user-2',
        userName: 'Alice Developer',
        type: 'deployment',
        description: 'Deployed project to production',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'activity-2',
        teamId: 'team-1',
        userId: 'user-1',
        userName: 'You',
        type: 'project-created',
        description: 'Created new project "E-commerce Store"',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'activity-3',
        teamId: 'team-1',
        userId: 'user-3',
        userName: 'Bob Viewer',
        type: 'member-joined',
        description: 'Joined the team',
        timestamp: '2024-03-10T09:00:00Z',
      }
    );
  }

  /**
   * Get all teams for current user
   */
  getTeams(): Team[] {
    return Array.from(this.teams.values());
  }

  /**
   * Get team by ID
   */
  getTeam(teamId: string): Team | undefined {
    return this.teams.get(teamId);
  }

  /**
   * Create new team
   */
  async createTeam(data: { name: string; description: string }): Promise<Team> {
    const team: Team = {
      id: `team-${Date.now()}`,
      name: data.name,
      description: data.description,
      plan: 'free',
      members: [
        {
          id: this.currentUserId,
          name: 'You',
          email: 'you@example.com',
          role: 'owner',
          status: 'active',
          joinedAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          permissions: ROLE_PERMISSIONS.owner,
        },
      ],
      projects: [],
      createdAt: new Date().toISOString(),
      settings: {
        allowInvites: true,
        requireApproval: false,
        defaultRole: 'developer',
        maxMembers: 5, // Free plan limit
        features: {
          collaboration: true,
          aiAssistance: true,
          deployment: false,
          analytics: false,
        },
      },
    };

    this.teams.set(team.id, team);
    return team;
  }

  /**
   * Update team
   */
  async updateTeam(teamId: string, data: Partial<Team>): Promise<Team> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const updated = { ...team, ...data };
    this.teams.set(teamId, updated);
    
    this.addActivity({
      teamId,
      userId: this.currentUserId,
      userName: 'You',
      type: 'settings-changed',
      description: 'Updated team settings',
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  /**
   * Delete team
   */
  async deleteTeam(teamId: string): Promise<void> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Check if user is owner
    const member = team.members.find(m => m.id === this.currentUserId);
    if (member?.role !== 'owner') {
      throw new Error('Only team owner can delete the team');
    }

    this.teams.delete(teamId);
  }

  /**
   * Invite member
   */
  async inviteMember(teamId: string, email: string, role: 'admin' | 'developer' | 'viewer'): Promise<Invitation> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    if (team.members.length >= team.settings.maxMembers) {
      throw new Error('Team has reached maximum member limit');
    }

    const invitation: Invitation = {
      id: `inv-${Date.now()}`,
      teamId,
      email,
      role,
      invitedBy: this.currentUserId,
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      status: 'pending',
    };

    this.invitations.set(invitation.id, invitation);
    return invitation;
  }

  /**
   * Get pending invitations for team
   */
  getTeamInvitations(teamId: string): Invitation[] {
    return Array.from(this.invitations.values())
      .filter(inv => inv.teamId === teamId && inv.status === 'pending');
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(invitationId: string): Promise<void> {
    const invitation = this.invitations.get(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    const team = this.teams.get(invitation.teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Add member to team
    const member: TeamMember = {
      id: `user-${Date.now()}`,
      name: invitation.email.split('@')[0],
      email: invitation.email,
      role: invitation.role,
      status: 'active',
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      permissions: ROLE_PERMISSIONS[invitation.role],
    };

    team.members.push(member);
    invitation.status = 'accepted';

    this.addActivity({
      teamId: team.id,
      userId: member.id,
      userName: member.name,
      type: 'member-joined',
      description: 'Joined the team',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Remove member
   */
  async removeMember(teamId: string, memberId: string): Promise<void> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const memberIndex = team.members.findIndex(m => m.id === memberId);
    if (memberIndex === -1) {
      throw new Error('Member not found');
    }

    const member = team.members[memberIndex];
    
    // Can't remove owner
    if (member.role === 'owner') {
      throw new Error('Cannot remove team owner');
    }

    team.members.splice(memberIndex, 1);

    this.addActivity({
      teamId,
      userId: memberId,
      userName: member.name,
      type: 'member-left',
      description: 'Left the team',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Update member role
   */
  async updateMemberRole(teamId: string, memberId: string, role: TeamMember['role']): Promise<void> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const member = team.members.find(m => m.id === memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    // Can't change owner role
    if (member.role === 'owner' || role === 'owner') {
      throw new Error('Cannot change owner role');
    }

    member.role = role;
    member.permissions = ROLE_PERMISSIONS[role];
  }

  /**
   * Check if user has permission
   */
  hasPermission(teamId: string, userId: string, permission: string): boolean {
    const team = this.teams.get(teamId);
    if (!team) return false;

    const member = team.members.find(m => m.id === userId);
    if (!member) return false;

    return member.permissions.includes(permission);
  }

  /**
   * Get team activities
   */
  getActivities(teamId: string, limit = 50): Activity[] {
    return this.activities
      .filter(a => a.teamId === teamId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Add activity
   */
  private addActivity(activity: Omit<Activity, 'id'>): void {
    this.activities.push({
      id: `activity-${Date.now()}`,
      ...activity,
    });
  }

  /**
   * Update team settings
   */
  async updateTeamSettings(teamId: string, settings: Partial<TeamSettings>): Promise<void> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    team.settings = { ...team.settings, ...settings };
    
    this.addActivity({
      teamId,
      userId: this.currentUserId,
      userName: 'You',
      type: 'settings-changed',
      description: 'Updated team settings',
      timestamp: new Date().toISOString(),
    });
  }
}

// Singleton instance
export const teamManagement = new TeamManagementService();
