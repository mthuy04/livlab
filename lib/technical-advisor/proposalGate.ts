import type { TechnicalValidationResult as Finding } from './types';

function conflictKey(finding: Finding) {
  // A rule may emit the same ID for success, missing data and a violation.
  // A collision pair can also change catalogue order between layouts.
  return JSON.stringify([finding.ruleId, finding.placementIssue, [...finding.affectedInstanceIds].sort(),
    finding.placementIssue === 'COLLISION' ? null : finding.id]);
}

export function compareProposalFindings(before: Finding[], after: Finding[], intendedIssueId?: string) {
  const existing = new Set(before.filter(f => f.placementIssue && f.severity === 'VERIFY').map(conflictKey));
  const introduced = after.filter(f => f.placementIssue && f.severity === 'VERIFY' && !existing.has(conflictKey(f)));
  const remaining = after.filter(f => f.severity !== 'SUITABLE' || f.requiresHumanVerification || f.reason);
  let issueResolved: boolean | undefined;
  if (intendedIssueId !== undefined) {
    const target = before.find(f => f.id === intendedIssueId && f.placementIssue);
    issueResolved = !!target && !after.some(f => {
      if (f.placementIssue && conflictKey(f) === conflictKey(target)) return true;
      // A replaced fixture with no evidence for this check cannot prove a fix.
      return f.ruleId === target.ruleId && (f.reason === 'MISSING_DATA' || f.dataSource === 'UNKNOWN' ||
        (f.requiresHumanVerification && !f.placementIssue)) &&
        (!f.affectedInstanceIds.length || f.affectedInstanceIds.some(id => target.affectedInstanceIds.includes(id)));
    });
  }
  return { introduced, remaining, issueResolved, eligible: !introduced.length && issueResolved !== false };
}
