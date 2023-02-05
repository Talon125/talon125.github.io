# Tetra Legends Ultimate

Combining the original Tetra Legends with Tetra Legends Plus, and adding some extra things I thought up of!

Original repositories:

<!-- https://github.com/doktorocelot/tetralegends -->
https://github.com/zacharylohrman/tetralegends/  
https://github.com/Rexxt/tetralegendsplus

Thank you:

- [zacharylohrman](https://github.com/zacharylohrman) [(Dr Ocelot)](https://github.com/doktorocelot)
- [MillaBasset](https://github.com/MillaBasset)
- [MattMayuga](https://github.com/MattMayuga)
- [Rexxt](https://github.com/Rexxt) (Mizu)

Play at: https://talon125.github.io/

My website:  
https://oktalon-szoradi.github.io/

<!-- I'm still deciding whether I'll keep this repository public or make it private. -->

## Changes I have made - since 2021-12-04

https://talon125.github.io/changelog.html

<!-- Most changes were made in early December. Early March 2022 is when I uploaded this here, and also tweaked the changelog below a bit. -->

<!-- btw I've been using Microsoft Edge to test my changes. -->

- Additions
  - Arcade modes and extra soundbanks from Tetra Legends Plus
  - Zen mode
    - In this mode there's no gravity
    - You can hold/skip as many times as you want
    - New lockdown mode: Zen
      - It's like infinite/forgiving, but the lockdown bar only depletes when softdropping
    - Pausing doesn't hide your stack/next/hold
    - There is no goal or end, so play to your heart's content!
    - You can also send garbage to yourself by pressing Enter
  - Ability to disable delays (ARE)
  - Ability to disable Lock Out
  - 4-Point All-Spin
    - Dr Ocelot started but didn't finish the code. So, I finished it
    <!-- *   This is on by default and cannot be changed (yet) -->
    - I piece has its own special code now (because the I piece is weird in 4-Point All-Spin)
  - EZ-Immobile
    - Functions the same way as it does in NullpoMino (if a piece is kicked, it's a mini spin)
    <!-- *   This only applies in Tetra-X modes You can't choose between spin detections yet -->
  - O-Spin Detection
    - Hybrid detection type that uses Immobile rules to decide if it's a spin, and some 4-Point-style rules to decide whether it's mini or not
    - Detection is used in all spin-enabled modes (both Immobile and 4-Point)
  - Ability to control spin detection (which system, which pieces)
  - My voice
    - Both in English and in German
    <!-- *   I plan on updating the voices in the future, like adding more clips for all the other spins/spin types
    - German was removed due to its low quality -->
  - ASC (Ascension) Rotation System
    - You can use this under Tuning > Rotation System Override
    <!-- *   It uses the Tetra-X skin (might be changed in the future  -> more piece skins?) -->
    - It uses the "Glossy" skin (might be changed in the future --> more piece skins?)
    - If you don't know what this is: [Click Me!](https://asc.winternebs.com/assets/home/kicktablesq.gif)
  - ASC-X Rotation System
    - Same as ASC but with SRS-X 180° kicks
  - Ability to import, export, and reset your settings
- Changes
  - Clutch clears are now allowed
    - i.e. placing a piece that would clear a line, but is placed fully above the Skyline (should be a Lock Out)  
      will no longer Lock Out. The line will clear, and a clutch effect is played
  - Hidden modes are no longer hidden
  - Night of Nights mode is now called Beat Mode
    - While in this mode, uses the unused Disco Lights background
    - You can choose which song to play
    <!-- *   Song is now Ludicrous Speed (F777). Using your own song might be added in the future
    - BPM is 166 instead of 180, so it might be a slight bit easier -->
  - Some German translations have been updated
  - Some default settings may have been changed to suit me
  - Music no longer mutes when the game gets unfocused. It instead gets quieter
  - Made the Top/Lock/Block Out warning sounds not fade quieter after 2 seconds
  - Gave the Top/Lock/Block Out warnings more urgent-looking effect
  - The collapse sound no longer plays if your stack doesn't fall
  - Survival mode additions:
    - You may now choose a Matrix width between 4 and 10
  - Survival and Zen modes:
    - You may now set a garbage cap
- Known Bugs
  <!-- *   Some S-Spin Minis are not detected for some reason. This exact bug is also in Tetr.JS Enhanced (another game from Dr Ocelot) -->
  <!-- *   When the board flips upside-down in Night Of Nights X, the animation is too slow -->
  - Sometimes (perhaps with right timing), the gameover UI will appear when the game has restarted
  - In Survival mode, there's a chance one garbage particle may stay on your Matrix
    - The following error notification may show in the bottom right (also in the developer tools' console of the browser)
      - /script/sound.js @ 300
      - Uncaught TypeError: Cannot read properties of undefined (reading 'hasDangerBgm')
    - Restarting this mode may trigger this bug
    - The garbage particle will only go away upon refreshing the page
  - Beat Mode (former Night of Nights mode):
    - Under some circumstances, Lock Out and Block Out will occur at the same time
      - Both voice clips are played at the same time
      - Also, sometimes the Game Over voice clip will be played twice (also at (around) the same time)
    - Music takes a little while to load
    - Holding at the right time may cause piece duplication
    - Rotating, then hard-dropping an O-Piece (so that it turns gray) rewards a Mini O-Spin
  - Sometimes errors can occur during IRS before the game starts
  <!-- *   The collapse sound still plays even when your stack doesn't fall -->
  - Even if IRS/IHS avoids a Block Out, the Block Out still occurs
  <!-- *   Doing an I-Spin Tetra will always be Back-To-Back, even if the previous line clear was not Back-To-Back
      *   Also occurs if this is your first line clear -->
  - Hold Block Out warning may not be completeley accurate when using skip instead of hold
    - If you are using pentominoes in combo challenge with skip, if the next piece is too big for the Matrix, and you initially skip it, the Hold Block Out warning will keep playing
  - In rare cases, the Matrix will be shifted a bit downwards. The borders are fine, but inside is shifted downwards. This is fixed after restarting the current game
  - In vary rare cases, hard-dropping(?) pieces may make them fractured (lose (a) mino(es)) or disappear
  - Sometimes sounds are not played in the correct order when loading a new game for the first time
  - Sometimes sounds are cut off when loading a new game for the first time
  - Both "ready" voices/sounds will play when loading an arcade game mode for the first time
  - In rare cases, the game looks scrunched when resized at a certain time
  - Upon resetting settings, updated audio volumes don't immediately take effect
  - Importing settings: Doesn't work by pressing Enter. Gamepad behavior is unknown
