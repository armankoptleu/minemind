# MineMind — AI Minesweeper Platform

## Live Demo
https://minemind-nfactoriall.vercel.app/

## GitHub Repository
https://github.com/armankoptleu/minemind

---

## Overview

MineMind is a modern AI-inspired Minesweeper web platform that transforms the classic Minesweeper game into a product-oriented interactive experience.

Instead of being just a puzzle game, MineMind combines:

- logic training
- probability thinking
- AI-assisted gameplay
- daily retention mechanics
- gamification systems
- social competition
- monetization concepts

This project was built as a product prototype for nFactorial.

---

## Product Idea

Traditional Minesweeper is a simple single-player puzzle.

MineMind reimagines it as:

**“Minesweeper for probability thinking, competitive challenges, and AI-assisted learning.”**

The goal is to create not just a game, but a scalable digital product.

---

## Target Audience

MineMind is designed for:

- students who want to improve logic skills
- puzzle lovers
- casual gamers
- competitive players
- users interested in decision-making under uncertainty
- people who enjoy short daily challenges

---

## Core Features

### Full Minesweeper Gameplay

Implemented full game mechanics:

- mine generation
- safe first click
- recursive empty-cell opening
- neighboring mine counts
- flag placement
- win detection
- loss detection

Difficulty levels:

- Easy
- Medium
- Hard
- Insane

---

## Game Modes

### Classic Random

Every restart creates a completely fresh random board.

Best for:

- practice
- repeated play
- casual users

---

### Daily Challenge

All users receive the same board on the same day.

Benefits:

- fair competition
- retention loop
- daily engagement
- leaderboard motivation

---

### Training Mode

Learning-focused mode.

Uses:

- AI Coach
- probability heatmap
- safer move suggestions

Purpose:

Help players understand logic instead of guessing.

---

### Speed Run 2 min

Fast competitive mode.

Player has 2 minutes to maximize performance.

Adds:

- urgency
- replayability
- challenge mode feeling

---

## AI Coach

MineMind includes an AI-inspired decision assistant.

AI Coach analyzes:

- opened cells
- nearby hidden cells
- placed flags
- neighboring mine counts

Then identifies:

- safest move
- highest risk move
- estimated risk
- tactical hints

Example:

> Best move: row 7, column 5. Estimated risk: 17%.

This is a rule-based intelligent assistant optimized for Minesweeper logic.

---

## Probability Heatmap

Visual risk analysis system.

Board colors indicate danger level:

- 🟢 Green → safest
- 🟡 Yellow → low-medium risk
- 🟠 Orange → high risk
- 🔴 Red → highest risk

Purpose:

Train probability thinking visually.

---

## Progression System

Gamification mechanics:

- XP system
- rank progression
- achievements
- win streaks
- game history
- best time tracking
- player statistics

Ranks:

- Beginner
- Mine Hunter
- Logic Analyst
- Probability Master
- MineMind Legend

---

## Social Features

### City Leaderboard

Demo leaderboard grouped by city:

- Almaty
- Astana
- Shymkent
- Aktau
- Karaganda

Purpose:

Add competition and community motivation.

Future version:

Real backend leaderboard with live users.

---

## Monetization Model

MineMind includes product monetization thinking.

### Free Version

Includes:

- Classic mode
- Daily Challenge
- Training mode
- Speed Run
- AI Coach
- statistics
- ad placements

---

### Pro Version

Price:

**990 ₸ / month**

Features:

- no ads
- advanced AI Coach
- full probability heatmap
- replay analysis
- mistake review
- premium skins
- daily rankings
- city tournaments

---

### Checkout Demo

Prototype payment UI includes:

- Kaspi Pay
- Apple Pay
- Visa / Mastercard

This demonstrates future monetization readiness.

---

## Product Thinking

MineMind was designed using startup/product principles.

### Retention

Retention mechanics:

- Daily Challenge
- XP
- ranks
- streaks
- achievements

These encourage repeat usage.

---

### Learning Value

Educational mechanics:

- AI Coach
- heatmap
- logic guidance

Transforms the game into a learning tool.

---

### Competition

Competitive systems:

- city leaderboard
- daily challenge
- speed run

Creates replay motivation.

---

### Monetization

Revenue concept:

Free + Pro subscription model.

Shows product business potential.

---

### Mobile Accessibility

Includes iPhone-friendly Open / Flag mode.

Allows gameplay without right-click.

---

## Tech Stack

Frontend:

- React
- Vite
- JavaScript
- CSS

Storage:

- LocalStorage

Deployment:

- Vercel

Version Control:

- Git
- GitHub

---

## Local Storage Usage

Saved data:

- player profile
- city
- XP
- rank
- wins
- losses
- streak
- best times
- history
- theme
- Pro demo state

Reason:

Fast lightweight prototype without backend complexity.

---

## Installation

Clone repository:

```bash
git clone https://github.com/armankoptleu/minemind.git
