// In-memory user store for development without database
export class InMemoryUserStore {
  constructor() {
    this.users = new Map() // email -> user object
    this.nextId = 1
  }

  findByEmail(email) {
    return this.users.get(email.toLowerCase())
  }

  findById(id) {
    for (const user of this.users.values()) {
      if (user.id === id) return user
    }
    return null
  }

  create(userData) {
    const user = {
      id: this.nextId++,
      email: userData.email?.toLowerCase() || null,
      phone: userData.phone || null,
      name: userData.name || null,
      passwordHash: userData.passwordHash,
      plan: userData.plan || 'free',
      googleId: userData.googleId || null,
      createdAt: new Date()
    }
    
    if (user.email) {
      this.users.set(user.email, user)
    }
    
    return user
  }

  getAll() {
    return Array.from(this.users.values())
  }
}

// Global instance
export const userStore = new InMemoryUserStore()
