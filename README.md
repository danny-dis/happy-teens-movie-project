<div align="center">

# 🎬 Movo & Filo

### Next-generation streaming platforms by zophlic

</div>

This repository contains two related but distinct streaming platform projects:

## [Movo](./movo)

A hybrid streaming platform that combines centralized services with P2P technology, offering the best of both worlds. It features the innovative Chimera Mode that allows users to seamlessly switch between online streaming and local content.

## [Filo](./filo)

A fully decentralized streaming platform with absolutely no central servers. All content is shared directly between users in a peer-to-peer network, creating a resilient, censorship-resistant platform for media sharing and consumption.

## Key Differences

| Feature | Movo | Filo |
|---------|------|------|
| Architecture | Hybrid (centralized + P2P) | Fully decentralized |
| Server Dependency | Requires servers for some features | No servers, fully P2P |
| Offline Support | Via Chimera Mode | Built-in by design |
| Content Discovery | Centralized database + P2P | Distributed hash table |
| User Authentication | Server-based | Cryptographic identity |
| Development Status | Production-ready | Experimental |

## Getting Started

See the README files in each project directory for specific setup and usage instructions:
- [Movo README](./movo/README.md)
- [Movo README](./movo/README.md)
- [Filo README](./filo/README.md)

## Setup & Configuration

This project uses environment variables for configuration.

1. **Movo Client**: Create `movo/client/.env` (see `deployment_guide.md`).
2. **Movo Server**: Create `movo/server/.env` (see `deployment_guide.md`).
3. **Install Dependencies**: Run `npm install` in each directory.


---

*Developed with ❤️ by zophlic*
