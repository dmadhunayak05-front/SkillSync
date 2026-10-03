/**
 * SkillSync Smart Matching Algorithm
 * Calculates compatibility score (0 - 100%) and generates structured "Why you match" bullet points.
 *
 * Weights:
 * - Direct Skill Overlap: 40% (User wants to learn what Peer teaches)
 * - Reciprocal Match: 25% (Peer wants to learn what User teaches)
 * - Shared Interests: 20% (Common fields e.g., AI, Design, Web)
 * - Availability Overlap: 15% (Matching free time slots)
 */

function normalize(str) {
  return (str || '').toLowerCase().trim();
}

function arrayIntersection(arr1 = [], arr2 = []) {
  const set2 = new Set(arr2.map(normalize));
  return arr1.filter(item => set2.has(normalize(item)));
}

export function calculateMatch(currentUser, peerUser) {
  if (!currentUser || !peerUser || currentUser.uid === peerUser.uid) {
    return { score: 0, reasons: [], breakdown: {} };
  }

  const userLearns = currentUser.skillsToLearn || [];
  const userTeaches = currentUser.skillsToTeach || [];
  const peerLearns = peerUser.skillsToLearn || [];
  const peerTeaches = peerUser.skillsToTeach || [];

  const userInterests = currentUser.interests || [];
  const peerInterests = peerUser.interests || [];

  const userAvail = currentUser.availability || [];
  const peerAvail = peerUser.availability || [];

  // 1. Direct Skill Overlap (Peer teaches what Current User wants to learn)
  const directSkills = arrayIntersection(userLearns, peerTeaches);
  let directScore = 0;
  if (userLearns.length > 0) {
    directScore = Math.min(1, directSkills.length / Math.max(1, Math.min(userLearns.length, 2)));
  }

  // 2. Reciprocal Skill Overlap (Current User teaches what Peer wants to learn)
  const reciprocalSkills = arrayIntersection(userTeaches, peerLearns);
  let reciprocalScore = 0;
  if (peerLearns.length > 0) {
    reciprocalScore = Math.min(1, reciprocalSkills.length / Math.max(1, Math.min(peerLearns.length, 2)));
  }

  // 3. Shared Interests
  const sharedInterests = arrayIntersection(userInterests, peerInterests);
  let interestScore = 0;
  if (userInterests.length > 0 && peerInterests.length > 0) {
    interestScore = Math.min(1, sharedInterests.length / 2);
  } else if (sharedInterests.length > 0) {
    interestScore = 0.5;
  }

  // 4. Availability Overlap
  const sharedAvail = arrayIntersection(userAvail, peerAvail);
  let availScore = 0;
  if (userAvail.length > 0 && peerAvail.length > 0) {
    availScore = Math.min(1, sharedAvail.length / Math.max(1, Math.min(userAvail.length, 2)));
  } else {
    // If either hasn't set strict slots, assume flexible 70% availability
    availScore = 0.7;
  }

  // Calculate weighted total (scaled to 100)
  // Base floor for college peer compatibility is 30% if they have at least 1 overlapping field
  const weighted = (directScore * 40) + (reciprocalScore * 25) + (interestScore * 20) + (availScore * 15);
  
  // Natural rounding between 45% and 98%
  let score = Math.round(weighted);
  if (directSkills.length > 0 && reciprocalSkills.length > 0) {
    // Perfect bilateral reciprocal match! e.g. Python <-> UI/UX
    score = Math.max(92, Math.min(98, score + 12));
  } else if (directSkills.length > 0) {
    score = Math.max(70, Math.min(89, score + 10));
  } else {
    score = Math.max(40, Math.min(65, score));
  }

  // Generate actionable, clear reasons for "Why you match"
  const reasons = [];

  if (directSkills.length > 0) {
    reasons.push({
      type: 'direct_skill',
      title: 'Skill Match',
      text: `${peerUser.name || 'They'} teaches ${directSkills.join(', ')} which you want to learn.`
    });
  }

  if (reciprocalSkills.length > 0) {
    reasons.push({
      type: 'reciprocal_skill',
      title: 'Mutual Exchange Opportunity',
      text: `You teach ${reciprocalSkills.join(', ')} which ${peerUser.name || 'they'} wants to learn.`
    });
  }

  if (sharedInterests.length > 0) {
    reasons.push({
      type: 'interest',
      title: 'Shared Focus Areas',
      text: `Both interested in ${sharedInterests.slice(0, 3).join(', ')}.`
    });
  }

  if (sharedAvail.length > 0) {
    reasons.push({
      type: 'availability',
      title: 'Aligned Schedule',
      text: `Overlapping availability on ${sharedAvail.join(', ')}.`
    });
  } else {
    reasons.push({
      type: 'flexible',
      title: 'Flexible Timing',
      text: 'Both students have active evening availability for 1-on-1 sessions.'
    });
  }

  if (peerUser.rating && peerUser.rating >= 4.7) {
    reasons.push({
      type: 'reputation',
      title: 'Top Rated Peer',
      text: `Rated ${peerUser.rating.toFixed(1)}/5.0 with ${peerUser.sessionsCompleted || 0} completed sessions.`
    });
  }

  return {
    score,
    reasons,
    breakdown: {
      skillOverlap: Math.round(directScore * 100),
      reciprocalFit: Math.round(reciprocalScore * 100),
      interestMatch: Math.round(interestScore * 100),
      availabilityMatch: Math.round(availScore * 100)
    },
    directSkills,
    reciprocalSkills,
    sharedInterests
  };
}
