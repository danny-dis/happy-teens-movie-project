<div align="center">
# 🎬 Movo & Filo - Happy Teens Movie Project

## Welcome to Next-Generation Streaming Platforms

</div>

Whether you want a modern streaming experience like Netflix, or a peer-to-peer solution that doesn't rely on servers, we have you covered.

---

## 📌 What is This Project?

This is a collection of two streaming platforms created by the zophlic community. They're designed to be:
- **Easy to use** - Simple interfaces that anyone can understand
- **Accessible** - Works on phones, tablets, computers, and through websites
- **Resilient** - Content can be shared without relying on big central servers
- **Community-focused** - Built by teens for teens to share movies and media

---

## 🎯 The Two Platforms

### **Movo** - The Flexible Streaming Platform

Movo is like a modern Netflix that's also smart about offline content.

**What does it do?**
- Stream movies and shows from servers (like Netflix)
- Switch between online and offline content smoothly with "Chimera Mode"
- Works with both centralized servers and peer-to-peer connections
- Great for areas with unreliable internet

**Best for:** Users who want a familiar streaming experience with offline backup options.

**Key Features:**
- User accounts and authentication
- Content recommendations
- Download movies for offline watching
- Automatic sync when you go back online
- Works on web and mobile apps

### **Filo** - The Fully Decentralized Platform

Filo is like a Netflix that has no main office - everything is run by the users themselves.

**What does it do?**
- Share movies directly between users (peer-to-peer)
- No central servers needed
- Works completely offline by design
- Can't be shut down or censored because there's nothing to shut down

**Best for:** Users who want complete freedom and don't trust central servers, or areas with no internet at all.

**Key Features:**
- Share content directly with friends
- Cryptographic identity (no passwords needed)
- Content discovery through the network itself
- Build private communities
- Completely decentralized and censorship-resistant

---

## 🔄 Comparing Movo and Filo

| Feature | **Movo** | **Filo** |
|---------|----------|---------|
| **How it works** | Uses servers + P2P together | Only peer-to-peer, no servers |
| **Internet needed** | Yes (mostly) | No, fully offline |
| **User accounts** | Yes, with passwords | No, uses crypto identity |
| **Offline content** | Via Chimera Mode | Built-in (always works offline) |
| **Finding content** | Central database | Network-wide search |
| **Is it ready?** | Yes, ready to use | Experimental (still being built) |
| **Best for** | Casual streaming | Privacy and freedom |

---

## 🚀 Getting Started

### Quick Start

1. **Choose your platform:**
   - Want a Netflix-like experience? → Go to [Movo](./movo)
   - Want fully decentralized sharing? → Go to [Filo](./filo)

2. **Read the detailed guide for your platform:**
   - [How to set up Movo](./movo/README.md)
   - [How to set up Filo](./filo/README.md)

3. **Install on your computer:**
   ```bash
   npm install
   ```

---

## 📋 Setup Instructions

### For Movo

1. **Create configuration file:** `movo/client/.env`
   - This tells the app where to find content
   - See `deployment_guide.md` for what to put in it

2. **Create server configuration:** `movo/server/.env`
   - This sets up the backend servers
   - See `deployment_guide.md` for details

3. **Install everything:**
   ```bash
   cd movo
   npm install
   ```

### For Filo

1. **Install dependencies:**
   ```bash
   cd filo
   npm install
   ```

2. **No server setup needed** - it's peer-to-peer!

---

## 💻 Technical Details For Developers

If you want to understand the technology:

- **Movo** uses Node.js for the server and React for the interface
- **Filo** uses advanced P2P networking and encryption
- Both platforms support encryption for privacy
- Mobile apps can be built using Capacitor technology

For developers:
- See [CONTRIBUTING.md](./CONTRIBUTING.md) to help improve the project
- Check [FRONTEND_IMPROVEMENTS.md](./FRONTEND_IMPROVEMENTS.md) for UI ideas
- Read [IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md) for what's being worked on

---

## 📦 Building Mobile Apps

Want to turn these into apps for Android or iPhone?

See [APK_BUILD_GUIDE.md](./APK_BUILD_GUIDE.md) for:
- Building Android apps (.apk files)
- Creating apps for iOS
- Uploading to app stores

---

## 🤝 Contributing

We'd love your help! Whether you can:
- **Code** - Fix bugs, add features
- **Design** - Make things look better
- **Translate** - Help users in other languages
- **Test** - Try it out and report problems

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to get started.

---

## 📝 License

This project is released under an open-source license. See [LICENSE](./LICENSE) for details.

---

## ❓ Questions?

- **Having trouble?** Check the README in each platform folder
- **Want to contribute?** Read [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Found a bug?** Create an issue on GitHub

---

<div align="center">

**Made with ❤️ by the zophlic community**

Bringing movies to the world - one stream at a time

</div>

