# Pokemon Run and Bun Calculator Ultimate

**The ultimate tool for the Pokemon Run and Bun ROM hack.**

This project combines the advanced damage calculation features of the [SylmarDev calculator](https://github.com/SylmarDev/syl-rnb-calc) with the essential savefile import functionality from the [unc calculator](https://github.com/unclest/rnbsavefile).

## Key Features

*   **Savefile Import**: Seamlessly import your **Pokemon Emerald save file (`.sav`)**. This automatically loads your current party and all Pokemon in your PC boxes into the calculator.
    *   No more manual entry of IVs, EVs, or Natures!
    *   Check your exact Pokemon against upcoming boss encounters instantly.
*   **Advanced Damage Calculation**: Includes all the Run and Bun specific mechanics and updates.
*   **Quality of Life**: Features range visualization, AI move prediction toggles, and improved UI from the SylmarDev fork.

## How to Use

1.  **Open the Calculator**: [Link to your hosted version if applicable, otherwise: Open `dist/index.html`]
2.  **Import Save**: 
    *   Scroll to the "Import / Export" section.
    *   Click the **"Import from Savefile"** button.
    *   Select your `.sav` file (Pokemon Emerald save).
    *   *Alternatively, drag and drop your `.sav` file into the import text area.*
3.  **Calculate**: Your imported Pokemon will appear in the "Custom Set" list (or under their specific names) for the Player side. Select one to see how it fares against the opponent!

## Development

If you want to run this locally or contribute:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/SynchEleven/rnb-calc-ultimate.git
    cd rnb-calc-ultimate
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Build the project:**
    ```bash
    npm run build
    ```

4.  **Run:**
    *   Open the generated `dist/index.html` file in your browser.

## Credits

*   **rnb-calc-ultimate**: Maintained by [SynchEleven](https://github.com/SynchEleven).
*   **syl-rnb-calc**: Created by [SylmarDev](https://github.com/SylmarDev), adding significant QoL and UI improvements.
*   **unc**: Created by [unclest](https://github.com/unclest), implementing the original Gen 3 savefile parsing logic.
*   **Smogon Damage Calc**: The original foundation, created by [Honko](https://github.com/Honko) and maintained by [Austin](https://github.com/Austin-Williams) and others.
