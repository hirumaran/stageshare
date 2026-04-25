import type { Conversation, CurrentUser, Message, Participant } from "../types"

export const currentUser: CurrentUser = {
  id: "u_me",
  name: "You",
  handle: "you",
}

export const participants: Participant[] = [
  {
    id: "u_ada",
    name: "Ada Lovelace",
    handle: "ada",
    presence: "online",
  },
  {
    id: "u_linus",
    name: "Linus Torvalds",
    handle: "linus",
    presence: "away",
  },
  {
    id: "u_grace",
    name: "Grace Hopper",
    handle: "grace",
    presence: "online",
  },
  {
    id: "u_alan",
    name: "Alan Turing",
    handle: "alan",
    presence: "offline",
  },
  {
    id: "u_margaret",
    name: "Margaret Hamilton",
    handle: "margaret",
    presence: "online",
  },
  {
    id: "u_dennis",
    name: "Dennis Ritchie",
    handle: "dennis",
    presence: "offline",
  },
]

const now = Date.now()
const minutes = (m: number) => new Date(now - m * 60_000).toISOString()
const hours = (h: number) => new Date(now - h * 60 * 60_000).toISOString()
const days = (d: number) => new Date(now - d * 24 * 60 * 60_000).toISOString()

export const conversations: Conversation[] = [
  {
    id: "c_ada",
    participants: [participants[0]],
    counterpartId: "u_ada",
    title: "Ada Lovelace",
    lastMessagePreview: "Pushed the analytical-engine refactor — take a look when you can.",
    lastMessageAt: minutes(2),
    unreadCount: 2,
    pinned: true,
  },
  {
    id: "c_grace",
    participants: [participants[2]],
    counterpartId: "u_grace",
    title: "Grace Hopper",
    lastMessagePreview: "Compiler is green across the board.",
    lastMessageAt: minutes(18),
    unreadCount: 0,
  },
  {
    id: "c_linus",
    participants: [participants[1]],
    counterpartId: "u_linus",
    title: "Linus Torvalds",
    lastMessagePreview: "Rebase first, force push later.",
    lastMessageAt: hours(3),
    unreadCount: 1,
  },
  {
    id: "c_margaret",
    participants: [participants[4]],
    counterpartId: "u_margaret",
    title: "Margaret Hamilton",
    lastMessagePreview: "Priority interrupt resolved. Apollo is GO.",
    lastMessageAt: hours(7),
    unreadCount: 0,
  },
  {
    id: "c_alan",
    participants: [participants[3]],
    counterpartId: "u_alan",
    title: "Alan Turing",
    lastMessagePreview: "Halting problem — still unsolved.",
    lastMessageAt: days(1),
    unreadCount: 0,
  },
  {
    id: "c_dennis",
    participants: [participants[5]],
    counterpartId: "u_dennis",
    title: "Dennis Ritchie",
    lastMessagePreview: "char *p = malloc(sizeof(*p) * n);",
    lastMessageAt: days(3),
    unreadCount: 0,
  },
]

export const messagesByConversation: Record<string, Message[]> = {
  c_ada: [
    {
      id: "m_a1",
      conversationId: "c_ada",
      authorId: "u_ada",
      body: "Morning. Did you get a chance to look at the analytical-engine branch?",
      createdAt: hours(2),
      status: "read",
    },
    {
      id: "m_a2",
      conversationId: "c_ada",
      authorId: "u_me",
      body: "Just opened it now. The note transformations look elegant.",
      createdAt: hours(2),
      status: "read",
    },
    {
      id: "m_a3",
      conversationId: "c_ada",
      authorId: "u_ada",
      body: "Thanks. I think we can ship the Bernoulli sequence by Friday if reviews go smoothly.",
      createdAt: minutes(45),
      status: "read",
    },
    {
      id: "m_a4",
      conversationId: "c_ada",
      authorId: "u_me",
      body: "Agreed. I'll start the test pass this afternoon.",
      createdAt: minutes(40),
      status: "read",
    },
    {
      id: "m_a5",
      conversationId: "c_ada",
      authorId: "u_ada",
      body: "Pushed the analytical-engine refactor — take a look when you can.",
      createdAt: minutes(2),
      status: "delivered",
    },
  ],
  c_grace: [
    {
      id: "m_g1",
      conversationId: "c_grace",
      authorId: "u_grace",
      body: "Built passes on every target. I added a minimal repro for the previous regression.",
      createdAt: hours(1),
      status: "read",
    },
    {
      id: "m_g2",
      conversationId: "c_grace",
      authorId: "u_me",
      body: "Nice. I'll wire the repro into CI.",
      createdAt: minutes(30),
      status: "read",
    },
    {
      id: "m_g3",
      conversationId: "c_grace",
      authorId: "u_grace",
      body: "Compiler is green across the board.",
      createdAt: minutes(18),
      status: "read",
    },
  ],
  c_linus: [
    {
      id: "m_l1",
      conversationId: "c_linus",
      authorId: "u_linus",
      body: "Your patch series has merge conflicts against main.",
      createdAt: hours(4),
      status: "read",
    },
    {
      id: "m_l2",
      conversationId: "c_linus",
      authorId: "u_me",
      body: "Thanks for the heads up — rebasing now.",
      createdAt: hours(4),
      status: "read",
    },
    {
      id: "m_l3",
      conversationId: "c_linus",
      authorId: "u_linus",
      body: "Rebase first, force push later.",
      createdAt: hours(3),
      status: "delivered",
    },
  ],
  c_margaret: [
    {
      id: "m_mh1",
      conversationId: "c_margaret",
      authorId: "u_margaret",
      body: "We caught the priority overflow during sim. Patch is in review.",
      createdAt: hours(8),
      status: "read",
    },
    {
      id: "m_mh2",
      conversationId: "c_margaret",
      authorId: "u_me",
      body: "Phew. That would have been a bad day.",
      createdAt: hours(8),
      status: "read",
    },
    {
      id: "m_mh3",
      conversationId: "c_margaret",
      authorId: "u_margaret",
      body: "Priority interrupt resolved. Apollo is GO.",
      createdAt: hours(7),
      status: "read",
    },
  ],
  c_alan: [
    {
      id: "m_t1",
      conversationId: "c_alan",
      authorId: "u_alan",
      body: "Did you ever finish reading the 1936 paper?",
      createdAt: days(1),
      status: "read",
    },
    {
      id: "m_t2",
      conversationId: "c_alan",
      authorId: "u_me",
      body: "Twice. I keep coming back to the diagonal argument.",
      createdAt: days(1),
      status: "read",
    },
    {
      id: "m_t3",
      conversationId: "c_alan",
      authorId: "u_alan",
      body: "Halting problem — still unsolved.",
      createdAt: days(1),
      status: "read",
    },
  ],
  c_dennis: [
    {
      id: "m_d1",
      conversationId: "c_dennis",
      authorId: "u_dennis",
      body: "Remember to free what you malloc.",
      createdAt: days(3),
      status: "read",
    },
    {
      id: "m_d2",
      conversationId: "c_dennis",
      authorId: "u_me",
      body: "Always.",
      createdAt: days(3),
      status: "read",
    },
    {
      id: "m_d3",
      conversationId: "c_dennis",
      authorId: "u_dennis",
      body: "char *p = malloc(sizeof(*p) * n);",
      createdAt: days(3),
      status: "read",
    },
  ],
}
