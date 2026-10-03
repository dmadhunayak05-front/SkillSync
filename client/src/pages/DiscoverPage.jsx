import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import { calculateMatch } from '../utils/matching';
import { SKILL_CATEGORIES } from '../data/mockData';
import StudentCard from '../components/discover/StudentCard';
import ConnectModal from '../components/discover/ConnectModal';
import { 
  Search, 
  Filter, 
  Sparkles, 
  Check, 
  SlidersHorizontal,
  GraduationCap
} from 'lucide-react';

export default function DiscoverPage({ onNavigate, initialQuery = '' }) {
  const { currentUser, allUsers } = useAuth();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [minMatch, setMinMatch] = useState(0);
  const [selectedStudentForConnect, setSelectedStudentForConnect] = useState(null);

  // Compute matches for other students
  const matchResults = useMemo(() => {
    const others = allUsers.filter(u => u.uid !== currentUser?.uid);
    return others.map(peer => {
      const match = calculateMatch(currentUser, peer);
      return {
        student: peer,
        matchResult: match,
        score: match.score
      };
    }).sort((a, b) => b.score - a.score);
  }, [allUsers, currentUser]);

  // Filter students based on search and category
  const filteredStudents = useMemo(() => {
    return matchResults.filter(({ student, score }) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = student.name.toLowerCase().includes(q);
        const matchesCollege = student.college?.toLowerCase().includes(q);
        const matchesTeach = (student.skillsToTeach || []).some(s => s.toLowerCase().includes(q));
        const matchesLearn = (student.skillsToLearn || []).some(s => s.toLowerCase().includes(q));
        const matchesBio = student.bio?.toLowerCase().includes(q);
        if (!matchesName && !matchesCollege && !matchesTeach && !matchesLearn && !matchesBio) {
          return false;
        }
      }

      // 2. Category
      if (selectedCategory !== 'all') {
        const cat = SKILL_CATEGORIES.find(c => c.id === selectedCategory);
        if (cat && cat.skills) {
          const hasTeachSkill = (student.skillsToTeach || []).some(s => cat.skills.includes(s));
          const hasLearnSkill = (student.skillsToLearn || []).some(s => cat.skills.includes(s));
          if (!hasTeachSkill && !hasLearnSkill) return false;
        }
      }

      // 3. Min Rating
      if (minRating > 0 && (student.rating || 5.0) < minRating) {
        return false;
      }

      // 4. Min Match %
      if (minMatch > 0 && score < minMatch) {
        return false;
      }

      return true;
    });
  }, [matchResults, searchQuery, selectedCategory, minRating, minMatch]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Peer Discovery & Skill Search</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Discover Students & Skills
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Search for verified students to learn from or share your expertise with. Every match shows why you're compatible.
        </p>
      </div>

      {/* Search & Category Filter Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        
        {/* Main Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by skill (Python, UI/UX, Java, SQL, DSA...), student name, or college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-brand-500 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {SKILL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Advanced Filter Sliders */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Min Match:</span>
            {[0, 75, 85, 90].map((val) => (
              <button
                key={val}
                onClick={() => setMinMatch(val)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors ${
                  minMatch === val 
                    ? 'bg-brand-50 border-brand-500 text-brand-700' 
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {val === 0 ? 'Any' : `${val}%+`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span>Rating:</span>
            {[0, 4.5, 4.8].map((val) => (
              <button
                key={val}
                onClick={() => setMinRating(val)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors ${
                  minRating === val 
                    ? 'bg-amber-50 border-amber-500 text-amber-800' 
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {val === 0 ? 'Any' : `⭐ ${val}+`}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-bold text-slate-500">
          Showing <span className="text-slate-900 font-extrabold">{filteredStudents.length}</span> students matching your criteria
        </p>
        <span className="text-[11px] text-slate-400">
          Sorted by compatibility score
        </span>
      </div>

      {/* Students Grid */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">No matching students found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try searching for a different skill or clear your filters to explore more student profiles.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setMinMatch(0); setMinRating(0); }}
            className="py-2 px-4 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudents.map(({ student, matchResult }) => (
            <StudentCard
              key={student.uid}
              student={student}
              matchResult={matchResult}
              onConnect={(p) => setSelectedStudentForConnect(p)}
              onViewProfile={(uid) => onNavigate('profile', { userId: uid })}
            />
          ))}
        </div>
      )}

      {/* Connect Modal */}
      {selectedStudentForConnect && (
        <ConnectModal
          isOpen={Boolean(selectedStudentForConnect)}
          onClose={() => setSelectedStudentForConnect(null)}
          targetUser={selectedStudentForConnect}
          onSent={() => setSelectedStudentForConnect(null)}
        />
      )}

    </div>
  );
}
