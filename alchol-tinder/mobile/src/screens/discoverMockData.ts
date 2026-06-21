import { DiscoverCandidate } from '../api/types';

/**
 * Temporary mock data for the "Nearby tonight" redesign. Shaped exactly like
 * `DiscoverCandidate` (the real `discover()` API response type) so swapping
 * this out for live data later is a one-line change in DiscoverScreen —
 * see the `candidates` state initialization there.
 *
 * Tag categories follow the product's tag taxonomy (taste / vibe / logistics).
 * Logistics tags are included here for completeness/realism but the
 * presentation layer (PersonCard/ChipList) intentionally filters them out of
 * the rendered chip row, since that state is already shown via the
 * availability toggle and distance line.
 */
export const discoverMockCandidates: DiscoverCandidate[] = [
  {
    id: 'mock-1',
    display_name: 'Maya',
    verification_status: 'verified',
    rating: 4.8,
    is_available: true,
    is_online: true,
    avatar_url: null,
    distance_km: 0.6,
    shared_tag_count: 3,
    tags: [
      { id: 't1', category: 'taste', name: 'wine' },
      { id: 't2', category: 'taste', name: 'cocktails' },
      { id: 't3', category: 'vibe', name: 'good conversation' },
      { id: 't4', category: 'vibe', name: 'relaxed evening' },
      { id: 't4b', category: 'vibe', name: 'celebration mode' },
      { id: 't4c', category: 'vibe', name: 'social mood' },
      { id: 't5', category: 'logistics', name: 'available tonight' },
      { id: 't6', category: 'logistics', name: 'virtual cheers first' },
    ],
  },
  {
    id: 'mock-2',
    display_name: 'Noa',
    verification_status: 'verified',
    rating: 4.6,
    is_available: true,
    is_online: false,
    avatar_url: null,
    distance_km: 2.3,
    shared_tag_count: 2,
    tags: [
      { id: 't7', category: 'taste', name: 'beer only' },
      { id: 't8', category: 'taste', name: 'gin & tonic' },
      { id: 't9', category: 'vibe', name: 'meet new people' },
      { id: 't10', category: 'vibe', name: 'celebration mode' },
      { id: 't11', category: 'vibe', name: 'social mood' },
      { id: 't12', category: 'logistics', name: 'prefer public place' },
      { id: 't13', category: 'logistics', name: 'virtual cheers first' },
      { id: 't14', category: 'logistics', name: 'nearby' },
    ],
  },
  {
    id: 'mock-3',
    display_name: 'Dan',
    verification_status: 'pending',
    rating: 4.2,
    is_available: true,
    is_online: true,
    avatar_url: null,
    distance_km: 4.1,
    shared_tag_count: 1,
    tags: [
      { id: 't15', category: 'taste', name: 'whiskey' },
      { id: 't16', category: 'vibe', name: 'looking for company at a bar' },
      { id: 't17', category: 'logistics', name: 'available now' },
      { id: 't18', category: 'logistics', name: 'prefer public place' },
    ],
  },
];
