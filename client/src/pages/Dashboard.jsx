import React, { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import SnippetList from '../components/snippet/SnippetList';
import SearchBar from '../components/common/SearchBar';
import snippetService from '../services/snippetService';

const Dashboard = () => {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Scroll to top when dashboard loads
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchSnippets();
  }, [searchQuery, filter]);

  const fetchSnippets = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      if (filter !== 'all') {
        if (filter === 'favorites') {
          params.favorite = 'true';
        } else {
          params.language = filter;
        }
      }

      const response = await snippetService.getAll(params);
      setSnippets(response.data.snippets);
    } catch (error) {
      console.error('Error fetching snippets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (snippetId) => {
    if (window.confirm('Are you sure you want to delete this snippet?')) {
      try {
        // Optimistically remove from UI
        setSnippets(prevSnippets => prevSnippets.filter(s => s._id !== snippetId));
        
        // Make API call
        await snippetService.delete(snippetId);
      } catch (error) {
        console.error('Error deleting snippet:', error);
        // Revert by refetching
        fetchSnippets();
        alert('Failed to delete snippet. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">
            My Snippets
          </h1>
          <p className="text-gray-600">
            Manage and organize your code snippets
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery}
            placeholder="Search snippets..."
          />
          
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent text-gray-700 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="favorites">Favorites</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>
        </div>

        {/* Snippets Grid */}
        <SnippetList snippets={snippets} loading={loading} onDelete={handleDelete} />
      </div>
    </div>
  );
};

export default Dashboard;
