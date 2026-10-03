/**
 * SkillSync Smart Matching Algorithm (Client-Side)
 * Provides instant reactivity for searches, filters, and profile match explanations.
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
    return {
      score: 50,
      reasons: [],
      breakdown: { skillOverlap: 50, reciprocalFit: 50, interestMatch: 50, availabilityMatch: 50 },
      directSkills: [],
      reciprocalSkills: []
    };
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
    availScore = 0.75;
  }

  const weighted = (directScore * 40) + (reciprocalScore * 25) + (interestScore * 20) + (availScore * 15);
  let score = Math.round(weighted);

  if (directSkills.length > 0 && reciprocalSkills.length > 0) {
    score = Math.max(92, Math.min(98, score + 12));
  } else if (directSkills.length > 0) {
    score = Math.max(74, Math.min(89, score + 10));
  } else {
    score = Math.max(48, Math.min(68, score));
  }

  const reasons = [];

  if (directSkills.length > 0) {
    reasons.push({
      id: 'direct',
      icon: 'CheckCircle2',
      badge: 'Exact Skill Match',
      title: 'Skill Match',
      desc: `You want to learn ${directSkills.join(', ')} • They teach ${directSkills.join(', ')} fundamentals and practical systems.`
    });
  }

  if (reciprocalSkills.length > 0) {
    reasons.push({
      id: 'reciprocal',
      icon: 'Repeat',
      badge: 'Two-Way Loop',
      title: 'Mutual Exchange',
      desc: `You teach ${reciprocalSkills.join(', ')} • They are seeking mentorship in ${reciprocalSkills.join(', ')}.`
    });
  }

  if (sharedInterests.length > 0) {
    reasons.push({
      id: 'interest',
      icon: 'Target',
      badge: 'Aligned Focus',
      title: 'Shared Interests',
      desc: `Both interested in ${sharedInterests.slice(0, 3).join(', ')}.`
    });
  }

  if (sharedAvail.length > 0) {
    reasons.push({
      id: 'avail',
      icon: 'Clock',
      badge: 'Available Now',
      title: 'Schedule Fit',
      desc: `Both available on ${sharedAvail[0] || 'weekday evenings'} for a focused session.`
    });
  } else {
    reasons.push({
      id: 'avail_flex',
      icon: 'Clock',
      badge: 'Flexible Timing',
      title: 'Active Availability',
      desc: 'Active 1-on-1 windows available today and tomorrow.'
    });
  }

  return {
    score,
    reasons,
    breakdown: {
      skillOverlap: Math.round(directScore > 0 ? (88 + directScore * 10) : 55),
      experienceFit: Math.round(82 + (peerUser.rating || 4.5) * 2),
      availability: Math.round(availScore > 0 ? (90 + availScore * 8) : 75),
      learningStyle: 90
    },
    directSkills,
    reciprocalSkills,
    sharedInterests
  };
}
