'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { supabase } from '@/lib/supabase';

interface NoticeItem {
  id: string;
  title: string;
  description: string;
  image_url?: string | null;
  created_at: string;
  is_pinned: boolean;
  status: 'published' | 'draft' | 'archived';
  type?: 'urgent' | 'general' | 'maintenance' | 'event';
  priority?: 'high' | 'medium' | 'low';
}

export default function Notice() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('notice');
  const [filterType, setFilterType] = useState<'all' | 'urgent' | 'general' | 'maintenance' | 'event'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: '',
    description: '',
    image_url: '',
    is_pinned: false,
    type: 'general' as const,
    priority: 'medium' as const
  });
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleLogout = () => {
    router.push('/login');
  };

  // Load notices from database
  useEffect(() => {
    loadNotices();
  }, []);

  // Alternative server-side upload for admin without UID
  const uploadImageViaServer = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      console.log('✅ Server upload successful:', result.url);
      return result.url;

    } catch (error) {
      console.error('Server upload error:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      
      // For admin panel, prefer server-side upload to bypass RLS issues
      console.log('🔄 Using server-side upload (bypasses UID/RLS issues)...');
      return await uploadImageViaServer(file);
      
    } catch (error) {
      console.error('Upload failed completely:', error);
      return null;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setNewNotice({...newNotice, image_url: ''});
  };

  const loadNotices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading notices:', error);
        return;
      }

      setNotices(data || []);
    } catch (error) {
      console.error('Error loading notices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load notices from database
  useEffect(() => {
    loadNotices();
  }, []);

  const filteredNotices = filterType === 'all' 
    ? notices.filter(notice => notice.status === 'published')
    : notices.filter(notice => notice.status === 'published' && notice.type === filterType);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'event':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'general':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateNotice = async () => {
    try {
      if (!newNotice.title.trim() || !newNotice.description.trim()) {
        alert('Please fill in all required fields');
        return;
      }

      setUploading(true);
      let imageUrl = newNotice.image_url;

      // Upload image if file is selected
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (!uploadedUrl) {
          alert('Failed to upload image. Please try again.');
          setUploading(false);
          return;
        }
        imageUrl = uploadedUrl;
      }

      const { data, error } = await supabase
        .from('notices')
        .insert([
          {
            title: newNotice.title.trim(),
            description: newNotice.description.trim(),
            image_url: imageUrl?.trim() || null,
            is_pinned: newNotice.is_pinned,
            status: 'published'
          }
        ])
        .select();

      if (error) {
        console.error('Error creating notice:', error);
        alert('Failed to create notice. Please try again.');
        return;
      }

      console.log('Notice created successfully:', data);
      setShowCreateModal(false);
      setNewNotice({
        title: '',
        description: '',
        image_url: '',
        is_pinned: false,
        type: 'general',
        priority: 'medium'
      });
      
      // Reset image states
      setImageFile(null);
      setImagePreview(null);

      // Reload notices to show the new one
      loadNotices();
    } catch (error) {
      console.error('Error creating notice:', error);
      alert('Failed to create notice. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="ml-64">
        <Topbar activeTab={activeTab} onLogout={handleLogout} />
        
        <main className="p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center items-center min-h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Header with Controls */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-800">Notice Board</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Notice
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All Notices' },
              { key: 'urgent', label: 'Urgent' },
              { key: 'general', label: 'General' },
              { key: 'maintenance', label: 'Maintenance' },
              { key: 'event', label: 'Events' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setFilterType(filter.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  filterType === filter.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-slate-600 hover:bg-blue-50 border border-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-600 text-sm">Total Notices</p>
                  <p className="text-2xl font-bold text-slate-800">{notices.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-600 text-sm">Urgent Notices</p>
                  <p className="text-2xl font-bold text-slate-800">{notices.filter(n => n.type === 'urgent').length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-600 text-sm">Events</p>
                  <p className="text-2xl font-bold text-slate-800">{notices.filter(n => n.type === 'event').length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-600 text-sm">Maintenance</p>
                  <p className="text-2xl font-bold text-slate-800">{notices.filter(n => n.type === 'maintenance').length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notices List */}
          <div className="space-y-4">
            {filteredNotices.map((notice) => (
              <div key={notice.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">{notice.title}</h3>
                      {notice.type && (
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getTypeColor(notice.type)}`}>
                          {notice.type.charAt(0).toUpperCase() + notice.type.slice(1)}
                        </span>
                      )}
                      {notice.priority && (
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getPriorityColor(notice.priority)}`}>
                          {notice.priority.toUpperCase()}
                        </span>
                      )}
                      {notice.is_pinned && (
                        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                          📌 PINNED
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 mb-3">{notice.description}</p>
                    
                    {/* Display image if available */}
                    {notice.image_url && (
                      <div className="mb-3">
                        <img
                          src={notice.image_url}
                          alt={notice.title}
                          className="w-full max-w-md h-48 object-cover rounded-lg border border-slate-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{new Date(notice.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="capitalize">{notice.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredNotices.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto w-12 h-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-slate-500">No notices found for the selected filter.</p>
            </div>
          )}
            </>
          )}
        </main>
      </div>

      {/* Create Notice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Create New Notice</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notice Title *</label>
                <input
                  type="text"
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
                  placeholder="Enter notice title"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content *</label>
                <textarea
                  value={newNotice.description}
                  onChange={(e) => setNewNotice({...newNotice, description: e.target.value})}
                  placeholder="Enter notice content"
                  rows={5}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Image (Optional)</label>
                <div className="space-y-3">
                  {!imagePreview ? (
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="flex items-center px-4 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Choose Image
                      </label>
                      <span className="text-sm text-slate-500">or</span>
                      <input
                        type="url"
                        value={newNotice.image_url}
                        onChange={(e) => setNewNotice({...newNotice, image_url: e.target.value})}
                        placeholder="Enter image URL"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-slate-500">Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={newNotice.type}
                    onChange={(e) => setNewNotice({...newNotice, type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                  >
                    <option value="general">General</option>
                    <option value="urgent">Urgent</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="event">Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={newNotice.priority}
                    onChange={(e) => setNewNotice({...newNotice, priority: e.target.value as any})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_pinned"
                  checked={newNotice.is_pinned}
                  onChange={(e) => setNewNotice({...newNotice, is_pinned: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_pinned" className="text-sm font-medium text-slate-700">
                  Pin this notice to the top
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNotice}
                disabled={!newNotice.title || !newNotice.description || uploading}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                {uploading && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {uploading ? 'Creating...' : 'Create Notice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
