'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { supabase, type ProposalRecord } from '@/lib/supabase';

interface VotingItem {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryColor: string;
  startDate: string;
  endDate: string;
  totalVotes: number;
  yesVotes: number;
  noVotes: number;
  status: 'active' | 'completed' | 'upcoming';
  department: string;
  location: string;
  estimatedBudget: string;
  priority: 'high' | 'medium' | 'low';
}

export default function Voting() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('voting');
  const [selectedItem, setSelectedItem] = useState<VotingItem | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCompletedDropdown, setShowCompletedDropdown] = useState(false);
  const [selectedCompletedProject, setSelectedCompletedProject] = useState<string | null>(null);
  const [showUpcomingDropdown, setShowUpcomingDropdown] = useState(false);
  const [selectedUpcomingProject, setSelectedUpcomingProject] = useState<string | null>(null);
  const [votingItems, setVotingItems] = useState<VotingItem[]>([]);

  const handleLogout = () => {
    router.push('/login');
  };

  // Load voting items from backend API and localStorage
  useEffect(() => {
    const loadVotingData = async () => {
      const defaultVotingItems: VotingItem[] = [
        {
          id: '1',
          title: 'New Public Park Development',
          description: 'Proposal to develop a new public park in the downtown area with playground, walking trails, and community spaces.',
          category: 'Infrastructure',
          categoryColor: 'bg-blue-100 text-blue-800',
          startDate: '2026-01-15',
          endDate: '2026-02-15',
          totalVotes: 342,
          yesVotes: 238,
          noVotes: 104,
          status: 'active',
          department: 'Parks & Recreation',
          location: 'Downtown District',
          estimatedBudget: 'Rs 2.5cr',
          priority: 'high'
        },
        {
          id: '2',
          title: 'Road Maintenance Budget Increase',
          description: 'Increase the annual road maintenance budget to improve city infrastructure and reduce potholes.',
          category: 'Budget',
          categoryColor: 'bg-blue-100 text-blue-800',
          startDate: '2026-01-10',
          endDate: '2026-02-10',
          totalVotes: 567,
          yesVotes: 389,
          noVotes: 178,
          status: 'completed',
          department: 'Public Works',
          location: 'City-wide',
          estimatedBudget: 'Rs 1.2M',
          priority: 'high'
        },
        {
          id: '3',
          title: 'Community Center Renovation',
          description: 'Renovate the old community center with modern facilities, updated technology, and accessibility improvements.',
          category: 'Community',
          categoryColor: 'bg-blue-100 text-blue-800',
          startDate: '2026-02-01',
          endDate: '2026-03-01',
          totalVotes: 0,
          yesVotes: 0,
          noVotes: 0,
          status: 'upcoming',
          department: 'Community Services',
          location: 'East Side',
          estimatedBudget: 'Rs 800K',
          priority: 'medium'
        },
        {
          id: '4',
          title: 'Bike Lane Network Expansion',
          description: 'Expand the city bike lane network to promote sustainable transportation and reduce traffic congestion.',
          category: 'Transportation',
          categoryColor: 'bg-blue-100 text-blue-800',
          startDate: '2025-12-01',
          endDate: '2026-01-01',
          totalVotes: 428,
          yesVotes: 312,
          noVotes: 116,
          status: 'completed',
          department: 'Transportation',
          location: 'Central Corridors',
          estimatedBudget: 'Rs 1.8M',
          priority: 'medium'
        }
      ];

      try {
        // Load proposals from backend API first
        const response = await fetch('http://localhost:5000/api/proposals');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.proposals) {
            // Convert backend proposals to VotingItem format
            const backendItems: VotingItem[] = result.proposals.map((proposal: any) => {
              const today = new Date().toISOString().split('T')[0];
              const endDate = new Date(proposal.ends_at).toISOString().split('T')[0];
              const createdDate = new Date(proposal.created_at).toISOString().split('T')[0];
              
              let status: 'active' | 'completed' | 'upcoming' = 'active';
              if (endDate < today) {
                status = 'completed';
              } else if (createdDate > today) {
                status = 'upcoming';
              }

              return {
                id: proposal.id,
                title: proposal.title,
                description: proposal.description,
                category: 'Community',
                categoryColor: 'bg-blue-100 text-blue-800',
                startDate: new Date(proposal.created_at).toISOString().split('T')[0],
                endDate: endDate,
                totalVotes: proposal.votes?.[0]?.count || 0,
                yesVotes: proposal.votes?.[0]?.count || 0,
                noVotes: 0,
                status: status,
                department: 'Community Services',
                location: 'Community Proposal',
                estimatedBudget: 'Rs N/A',
                priority: 'medium'
              };
            });

            // Combine with default items and localStorage items
            const storedItems = JSON.parse(localStorage.getItem('voting_items') || '[]');
            const allItems = [...defaultVotingItems, ...backendItems, ...storedItems];
            setVotingItems(allItems);
          } else {
            throw new Error('Invalid API response');
          }
        } else {
          throw new Error('API request failed');
        }
      } catch (apiError) {
        console.warn('API failed, trying direct Supabase:', apiError);
        
        // Fallback to direct Supabase query
        try {
          const { data: proposals, error } = await supabase
            .from('proposals')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            throw error;
          }

          // Convert Supabase proposals to VotingItem format
          const supabaseItems: VotingItem[] = proposals.map((proposal: ProposalRecord) => {
            const today = new Date().toISOString().split('T')[0];
            const endDate = new Date(proposal.ends_at).toISOString().split('T')[0];
            const createdDate = new Date(proposal.created_at || '').toISOString().split('T')[0];
            
            let status: 'active' | 'completed' | 'upcoming' = 'active';
            if (endDate < today) {
              status = 'completed';
            } else if (createdDate > today) {
              status = 'upcoming';
            }

            return {
              id: proposal.id || '',
              title: proposal.title,
              description: proposal.description,
              category: 'Community',
              categoryColor: 'bg-blue-100 text-blue-800',
              startDate: createdDate,
              endDate: endDate,
              totalVotes: 0,
              yesVotes: 0,
              noVotes: 0,
              status: status,
              department: 'Community Services',
              location: 'Community Proposal',
              estimatedBudget: 'Rs N/A',
              priority: 'medium'
            };
          });

          // Combine with default items and localStorage items
          const storedItems = JSON.parse(localStorage.getItem('voting_items') || '[]');
          const allItems = [...defaultVotingItems, ...supabaseItems, ...storedItems];
          setVotingItems(allItems);
          
        } catch (supabaseError) {
          console.error('Both API and Supabase failed:', supabaseError);
          // Final fallback to localStorage only
          const storedItems = JSON.parse(localStorage.getItem('voting_items') || '[]');
          const allItems = [...defaultVotingItems, ...storedItems];
          setVotingItems(allItems);
        }
      }
    };

    loadVotingData();
  }, []);

  const filteredItems = selectedCompletedProject 
    ? votingItems.filter(item => item.id === selectedCompletedProject)
    : selectedUpcomingProject
    ? votingItems.filter(item => item.id === selectedUpcomingProject)
    : votingItems.filter(item => item.status === 'active');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'low':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVotePercentage = (yesVotes: number, totalVotes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((yesVotes / totalVotes) * 100);
  };

  const isVotingActive = (status: string) => status === 'active';

  const completedProjects = votingItems.filter(item => item.status === 'completed');
  const upcomingProjects = votingItems.filter(item => item.status === 'upcoming');

  const handleCompletedClick = () => {
    if (filterStatus === 'completed') {
      setShowCompletedDropdown(!showCompletedDropdown);
    } else {
      setFilterStatus('completed');
      setSelectedCompletedProject(null);
      setShowCompletedDropdown(false);
    }
  };

  const handleUpcomingClick = () => {
    if (filterStatus === 'upcoming') {
      setShowUpcomingDropdown(!showUpcomingDropdown);
    } else {
      setFilterStatus('upcoming');
      setSelectedUpcomingProject(null);
      setShowUpcomingDropdown(false);
    }
  };

  const handleCompletedProjectSelect = (projectId: string) => {
    setSelectedCompletedProject(projectId);
    setSelectedUpcomingProject(null);
    setShowCompletedDropdown(false);
    setFilterStatus('completed');
  };

  const handleUpcomingProjectSelect = (projectId: string) => {
    setSelectedUpcomingProject(projectId);
    setSelectedCompletedProject(null);
    setShowUpcomingDropdown(false);
    setFilterStatus('upcoming');
  };

  const handleBackToAll = () => {
    setSelectedCompletedProject(null);
    setSelectedUpcomingProject(null);
    setFilterStatus('all');
    setShowCompletedDropdown(false);
    setShowUpcomingDropdown(false);
  };



  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="ml-64">
        <Topbar activeTab={activeTab} onLogout={handleLogout} />
        
        <main className="p-6 space-y-6">
          {/* Controls */}
          <div className="flex justify-end items-center">
            <div className="flex gap-3">
              <button
                onClick={handleBackToAll}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to All
              </button>
              
              <div className="relative">
                <button
                  onClick={handleCompletedClick}
                  className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex items-center gap-2 text-black ${
                    filterStatus === 'completed' ? 'border-blue-500 bg-blue-50' : 'border-slate-300'
                  }`}
                >
                  Completed Projects
                  <svg className={`w-4 h-4 transition-transform ${
                    showCompletedDropdown ? 'rotate-180' : ''
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showCompletedDropdown && (
                  <div className="absolute top-full mt-1 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                    {completedProjects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleCompletedProjectSelect(project.id)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg border-b border-slate-100 last:border-b-0"
                      >
                        <div className="font-medium text-slate-800">{project.title}</div>
                        <div className="text-xs text-slate-500">{project.department}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={handleUpcomingClick}
                  className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex items-center gap-2 text-black ${
                    filterStatus === 'upcoming' ? 'border-blue-500 bg-blue-50' : 'border-slate-300'
                  }`}
                >
                  Upcoming Projects
                  <svg className={`w-4 h-4 transition-transform ${
                    showUpcomingDropdown ? 'rotate-180' : ''
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showUpcomingDropdown && (
                  <div className="absolute top-full mt-1 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                    {upcomingProjects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleUpcomingProjectSelect(project.id)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg border-b border-slate-100 last:border-b-0"
                      >
                        <div className="font-medium text-slate-800">{project.title}</div>
                        <div className="text-xs text-slate-500">{project.department}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Active Votes</p>
                  <p className="text-2xl font-bold text-slate-800">{votingItems.filter(item => item.status === 'active').length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Participants</p>
                  <p className="text-2xl font-bold text-slate-800">{votingItems.reduce((sum, item) => sum + item.totalVotes, 0)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Upcoming Votes</p>
                  <p className="text-2xl font-bold text-slate-800">{votingItems.filter(item => item.status === 'upcoming').length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold text-slate-800">{votingItems.filter(item => item.status === 'completed').length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Voting Items Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{item.title}</h3>
                    <p className="text-slate-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-slate-500">Department</p>
                    <p className="font-medium text-slate-800">{item.department}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Location</p>
                    <p className="font-medium text-slate-800">{item.location}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Budget</p>
                    <p className="font-medium text-slate-800">{item.estimatedBudget}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">End Date</p>
                    <p className="font-medium text-slate-800">{new Date(item.endDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Voting Progress */}
                {item.totalVotes > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700">Voting Progress</span>
                      <span className="text-sm text-slate-600">{item.totalVotes} total votes</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getVotePercentage(item.yesVotes, item.totalVotes)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Yes: {item.yesVotes} ({getVotePercentage(item.yesVotes, item.totalVotes)}%)</span>
                      <span>No: {item.noVotes} ({100 - getVotePercentage(item.yesVotes, item.totalVotes)}%)</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedItem(item)}
                    className="w-full bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto w-12 h-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-slate-500">
                {selectedCompletedProject 
                  ? 'Selected project not found.' 
                  : 'No active voting polls available at the moment.'
                }
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Modal for completed/upcoming items */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-slate-800">{selectedItem.title}</h2>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-slate-600 mb-4">{selectedItem.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Status</p>
                  <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(selectedItem.status)} mt-1`}>
                    {selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500">Priority</p>
                  <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium border ${getPriorityBadge(selectedItem.priority)} mt-1`}>
                    {selectedItem.priority.charAt(0).toUpperCase() + selectedItem.priority.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500">Department</p>
                  <p className="font-medium text-slate-800">{selectedItem.department}</p>
                </div>
                <div>
                  <p className="text-slate-500">Location</p>
                  <p className="font-medium text-slate-800">{selectedItem.location}</p>
                </div>
                <div>
                  <p className="text-slate-500">Estimated Budget</p>
                  <p className="font-medium text-slate-800">{selectedItem.estimatedBudget}</p>
                </div>
                <div>
                  <p className="text-slate-500">Voting Period</p>
                  <p className="font-medium text-slate-800">
                    {new Date(selectedItem.startDate).toLocaleDateString()} - {new Date(selectedItem.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedItem.totalVotes > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-slate-800 mb-2">Final Results</h3>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700">Total Votes: {selectedItem.totalVotes}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${getVotePercentage(selectedItem.yesVotes, selectedItem.totalVotes)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600 font-medium">Yes: {selectedItem.yesVotes} ({getVotePercentage(selectedItem.yesVotes, selectedItem.totalVotes)}%)</span>
                      <span className="text-slate-600 font-medium">No: {selectedItem.noVotes} ({100 - getVotePercentage(selectedItem.yesVotes, selectedItem.totalVotes)}%)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
