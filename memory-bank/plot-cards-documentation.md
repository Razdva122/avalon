# Plot Cards Documentation

This file serves as an index for all documentation related to plot cards in the Avalon project.

## Available Documentation

1. [Adding Plot Cards](adding-plot-cards.md) - Detailed guide on how to add new plot cards to the game
2. [Plot Cards CardID Update](plot-cards-cardid-update.md) - Information about the cardID requirement for using plot cards

## Plot Cards in Memory Bank

Plot cards are also documented in the following Memory Bank files:

1. [Game Logic](memory-bank-game.md) - Contains general information about plot cards as an addon
2. [Active Context](activeContext.md) - Contains information about recent changes to the plot cards system
3. [Decision Log](decisionLog.md) - Contains information about the decision to refactor the plot cards system
4. [Progress](progress.md) - Contains information about the implementation progress of plot cards changes

## Key Concepts

- Plot cards are special cards with unique effects that can affect gameplay
- Each plot card has a unique ID that must be sent when using the card
- Plot cards can be of three types: usable, instant, or effect
- The frontend must retrieve and pass the card ID when calling plot card-related methods
