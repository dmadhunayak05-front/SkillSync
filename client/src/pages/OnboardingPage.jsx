import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  BookOpen, 
  Award, 
  Heart, 
  Clock, 
  User, 
  Plus, 
  X,
  CheckCircle2
} from 'lucide-react';

const COMMON_SKILLS = [
  'Python', 'Flask', 'Java', 'DSA', 'JavaScript', 'React', 'Next.js', 
  'UI/UX', 'Figma', 'Design Systems', 'SQL', 'Git', 'Canva', 
  'Video Editing', 'Premiere Pro', 'Photography', 'Public Speaking', 
  'Communication', 'Pitch Decks', 'Excel'
];

const COMMON_INTERESTS = [
  'Technology', 'Design', 'Artificial Intelligence', 'Open Source', 
  'Entrepreneurship', 'Content Creation', 'Photography', 'Mobile Apps', 
  'Product Management', 'Competitive Programming', 'Business Strategy'
];

const DEFAULT_DAYS = [
  'Monday 5 PM - 8 PM',
  'Tuesday 5 PM - 8 PM',
  'Wednesday 4 PM - 7 PM',
  'Thursday 5 PM - 8 PM',
  'Friday 4 PM - 8 PM',
  'Saturday 10 AM - 1 PM',
  'Sunday 2 PM - 5 PM'
];

export default function OnboardingPage({ onNavigate }) {
  const { currentUser, updateProfile } = useAuth();

  const [step, setStep] = useState(1);

  // Form states initialized with currentUser if editing
  const [name, setName] = useState(currentUser?.name || '');
  const [college, setCollege] = useState(currentUser?.college || '');
  const [course, setCourse] = useState(currentUser?.course || '');
  const [year, setYear] = useState(currentUser?.year || '2nd Year');
  const [bio, setBio] = useState(currentUser?.bio || '');

  const [skillsToTeach, setSkillsToTeach] = useState(currentUser?.skillsToTeach || ['UI/UX', 'Figma']);
  const [skillsToLearn, setSkillsToLearn] = useState(currentUser?.skillsToLearn || ['Python', 'Flask']);
  const [interests, setInterests] = useState(currentUser?.interests || ['Technology', 'Design']);
  const [availability, setAvailability] = useState(
    currentUser?.availability?.length > 0 ? currentUser.availability : ['Monday 5 PM - 8 PM', 'Tuesday 5 PM - 8 PM']
  );

  const [customTeach, setCustomTeach] = useState('');
  const [customLearn, setCustomLearn] = useState('');

  const toggleItem = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleAddCustomTeach = () => {
    if (customTeach.trim() && !skillsToTeach.includes(customTeach.trim())) {
      setSkillsToTeach([...skillsToTeach, customTeach.trim()]);
      setCustomTeach('');
    }
  };

  const handleAddCustomLearn = () => {
    if (customLearn.trim() && !skillsToLearn.includes(customLearn.trim())) {
      setSkillsToLearn([...skillsToLearn, customLearn.trim()]);
      setCustomLearn('');
    }
  };

  const handleFinish = () => {
    updateProfile({
      name: name.trim() || 'Student',
      college: college.trim() || 'Tech Institute',
      course: course.trim() || 'B.Tech CS',
      year,
      bio: bio.trim() || 'Passionate student excited to learn and teach skills on SkillSync.',
      skillsToTeach,
      skillsToLearn,
      interests,
      availability
    });

    onNavigate('dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 px-4 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Step {step} of 5</span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {step === 1 && "Basic Student Information"}
          {step === 2 && "Skills You Can Teach"}
          {step === 3 && "Skills You Want To Learn"}
          {step === 4 && "Your Interests & Focus Areas"}
          {step === 5 && "Your Weekly Availability"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          This data powers our Smart Matching algorithm to pair you with the best student mentors.
        </p>

        {/* Step Indicator Progress Bar */}
        <div className="flex items-center justify-center gap-2 pt-3 max-w-xs mx-auto">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all ${
                step >= s ? 'bg-brand-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step Content Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        
        {/* STEP 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Manideep Reddy"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">College / University</label>
                <input
                  type="text"
                  placeholder="e.g. IIT Delhi, BITS Pilani"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Course / Major</label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech Computer Science"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Year of Study</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-semibold"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Short Bio & Introduction</label>
              <textarea
                rows={3}
                placeholder="Tell peers what you love building and what your learning journey is about..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-4 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Skills I Can Teach */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Select all skills you feel confident sharing or helping a fellow student with:
            </p>

            <div className="flex flex-wrap gap-2">
              {COMMON_SKILLS.map((skill) => {
                const selected = skillsToTeach.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleItem(skillsToTeach, setSkillsToTeach, skill)}
                    className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selected
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5" />}
                    <span>{skill}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Skill Input */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Add other skill (e.g. Flutter, C++)..."
                value={customTeach}
                onChange={(e) => setCustomTeach(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTeach())}
                className="flex-1 px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={handleAddCustomTeach}
                className="py-2 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Skills I Want to Learn */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Select the skills or frameworks you want peer mentorship in:
            </p>

            <div className="flex flex-wrap gap-2">
              {COMMON_SKILLS.map((skill) => {
                const selected = skillsToLearn.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleItem(skillsToLearn, setSkillsToLearn, skill)}
                    className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selected
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5" />}
                    <span>{skill}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Skill Input */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Add other learning goal (e.g. FastAPI, Tailwind)..."
                value={customLearn}
                onChange={(e) => setCustomLearn(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomLearn())}
                className="flex-1 px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <button
                type="button"
                onClick={handleAddCustomLearn}
                className="py-2 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Interests */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Shared interests help our engine find students who speak your language and share project vibes:
            </p>

            <div className="flex flex-wrap gap-2">
              {COMMON_INTERESTS.map((interest) => {
                const selected = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleItem(interests, setInterests, interest)}
                    className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5" />}
                    <span>{interest}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Availability */}
        {step === 5 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Select time blocks when you're generally free for 30–60 min video calls:
            </p>

            <div className="space-y-2">
              {DEFAULT_DAYS.map((slot) => {
                const selected = availability.includes(slot);
                return (
                  <div
                    key={slot}
                    onClick={() => toggleItem(availability, setAvailability, slot)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      selected
                        ? 'bg-brand-50 border-brand-500 text-brand-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs font-bold">{slot}</span>
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                      selected ? 'bg-brand-600 text-white' : 'border border-slate-300'
                    }`}>
                      {selected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="py-2.5 px-5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
            >
              Previous
            </button>
          ) : <div />}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="py-3 px-7 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Profile & Enter Dashboard</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
