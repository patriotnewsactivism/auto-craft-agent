import { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Shield, Activity, Settings as SettingsIcon, Crown, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { teamManagement, Team, TeamMember, Invitation, Activity as TeamActivity } from '@/lib/teamManagement';

export const TeamManagement = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'developer' | 'viewer'>('developer');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      loadTeamData(selectedTeam.id);
    }
  }, [selectedTeam]);

  const loadTeams = () => {
    const allTeams = teamManagement.getTeams();
    setTeams(allTeams);
    if (allTeams.length > 0 && !selectedTeam) {
      setSelectedTeam(allTeams[0]);
    }
  };

  const loadTeamData = (teamId: string) => {
    setInvitations(teamManagement.getTeamInvitations(teamId));
    setActivities(teamManagement.getActivities(teamId, 20));
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a team name',
        variant: 'destructive',
      });
      return;
    }

    try {
      const team = await teamManagement.createTeam({
        name: newTeamName,
        description: newTeamDescription,
      });
      
      toast({
        title: 'Team Created',
        description: `${team.name} has been created successfully`,
      });
      
      setNewTeamName('');
      setNewTeamDescription('');
      loadTeams();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create team',
        variant: 'destructive',
      });
    }
  };

  const handleInviteMember = async () => {
    if (!selectedTeam) return;
    
    if (!inviteEmail.trim()) {
      toast({
        title: 'Email Required',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    try {
      await teamManagement.inviteMember(selectedTeam.id, inviteEmail, inviteRole);
      
      toast({
        title: 'Invitation Sent',
        description: `Invitation sent to ${inviteEmail}`,
      });
      
      setInviteEmail('');
      loadTeamData(selectedTeam.id);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send invitation',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedTeam) return;

    try {
      await teamManagement.removeMember(selectedTeam.id, memberId);
      
      toast({
        title: 'Member Removed',
        description: 'Team member has been removed',
      });
      
      const updated = teamManagement.getTeam(selectedTeam.id);
      if (updated) setSelectedTeam(updated);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove member',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRole = async (memberId: string, role: TeamMember['role']) => {
    if (!selectedTeam) return;

    try {
      await teamManagement.updateMemberRole(selectedTeam.id, memberId, role);
      
      toast({
        title: 'Role Updated',
        description: 'Member role has been updated',
      });
      
      const updated = teamManagement.getTeam(selectedTeam.id);
      if (updated) setSelectedTeam(updated);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update role',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeColor = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner': return 'bg-purple-500';
      case 'admin': return 'bg-blue-500';
      case 'developer': return 'bg-green-500';
      case 'viewer': return 'bg-gray-500';
    }
  };

  const getRoleIcon = (role: TeamMember['role']) => {
    if (role === 'owner') return <Crown className="h-3 w-3" />;
    if (role === 'admin') return <Shield className="h-3 w-3" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            <span className="gradient-text">Team Management</span>
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage your teams and collaborate with others
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="default" className="animated-gradient">
              <Users className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Create a new team to collaborate with others
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Team Name</Label>
                <Input
                  placeholder="My Awesome Team"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  placeholder="What's this team about?"
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateTeam}>Create Team</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Selector */}
      {teams.length > 0 && (
        <Card className="p-4">
          <Label className="mb-2 block">Select Team</Label>
          <Select
            value={selectedTeam?.id}
            onValueChange={(teamId) => {
              const team = teams.find(t => t.id === teamId);
              if (team) setSelectedTeam(team);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name} ({team.members.length} members)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
      )}

      {selectedTeam && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Team Info */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold">{selectedTeam.name}</h3>
                  <p className="text-muted-foreground">{selectedTeam.description}</p>
                </div>
                <Badge className={
                  selectedTeam.plan === 'enterprise' ? 'bg-purple-500' :
                  selectedTeam.plan === 'pro' ? 'bg-blue-500' :
                  'bg-gray-500'
                }>
                  {selectedTeam.plan.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{selectedTeam.members.length}</div>
                  <div className="text-sm text-muted-foreground">Members</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{selectedTeam.projects.length}</div>
                  <div className="text-sm text-muted-foreground">Projects</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{invitations.length}</div>
                  <div className="text-sm text-muted-foreground">Pending Invites</div>
                </div>
              </div>
            </Card>

            {/* Members */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                </h3>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to join {selectedTeam.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="developer">Developer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleInviteMember}>Send Invitation</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {selectedTeam.members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                          <div className="text-xs text-muted-foreground">
                            Last active: {new Date(member.lastActive).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {getRoleIcon(member.role)}
                          {member.role}
                        </Badge>
                        
                        {member.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pending Invitations */}
            <Card className="p-4">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5" />
                Pending Invitations
              </h3>
              
              {invitations.length > 0 ? (
                <div className="space-y-2">
                  {invitations.map(inv => (
                    <div key={inv.id} className="p-3 rounded-lg border">
                      <div className="text-sm font-medium">{inv.email}</div>
                      <div className="text-xs text-muted-foreground">
                        as {inv.role} · {new Date(inv.invitedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No pending invitations</p>
              )}
            </Card>

            {/* Recent Activity */}
            <Card className="p-4">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5" />
                Recent Activity
              </h3>
              
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {activities.map(activity => (
                    <div key={activity.id} className="text-sm">
                      <div className="font-medium">{activity.userName}</div>
                      <div className="text-muted-foreground">{activity.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      )}

      {teams.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Teams Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first team to start collaborating
          </p>
          <Button variant="default" className="animated-gradient">
            <Users className="h-4 w-4 mr-2" />
            Create Your First Team
          </Button>
        </Card>
      )}
    </div>
  );
};
