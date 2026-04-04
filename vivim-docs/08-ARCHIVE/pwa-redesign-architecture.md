# PWA Redesign - Architecture Overview

## Design System Architecture

```mermaid
graph TB
    subgraph DesignSystem[Design System Foundation]
        Tokens[Design Tokens]
        Base[Base Styles]
        Utilities[Utility Classes]
    end

    subgraph Components[Component Library]
        Buttons[Buttons]
        Inputs[Inputs]
        Cards[Cards]
        Modals[Modals]
        Badges[Badges]
        Avatars[Avatars]
        Skeletons[Skeletons]
        Toasts[Toasts]
        Progress[Progress]
        Empty[Empty States]
    end

    subgraph Layouts[Layout Components]
        TopBar[TopBar]
        BottomNav[BottomNav]
        Container[Container]
        Grid[Grid]
        Flex[Flex]
    end

    subgraph Pages[Page Components]
        Home[Home]
        Capture[Capture]
        Search[Search]
        AIChat[AI Chat]
        Settings[Settings]
        Conversation[ConversationView]
        Analytics[Analytics]
        Bookmarks[Bookmarks]
        Collections[Collections]
        ForYou[For You]
    end

    subgraph Themes[Theming]
        Light[Light Mode]
        Dark[Dark Mode]
        System[System Preference]
    end

    Tokens --> Components
    Tokens --> Layouts
    Base --> Utilities
    Utilities --> Components
    Utilities --> Layouts

    Components --> Pages
    Layouts --> Pages

    Themes --> Tokens
    Themes --> Base

    style Tokens fill:#6366f1
    style Components fill:#8b5cf6
    style Layouts fill:#10b981
    style Pages fill:#f59e0b
    style Themes fill:#ef4444
```

## Component Hierarchy

```mermaid
graph LR
    subgraph Foundation
        T[Design Tokens]
        B[Base Styles]
    end

    subgraph Primitives
        Btn[Button]
        Inp[Input]
        Txt[Typography]
        Icn[Icon]
    end

    subgraph Composites
        Card[Card]
        Modal[Modal]
        Toast[Toast]
        Badge[Badge]
    end

    subgraph Features
        SearchBar[SearchBar]
        MessageBubble[MessageBubble]
        ConversationCard[ConversationCard]
        StatCard[StatCard]
    end

    subgraph Layouts
        TopB[TopBar]
        BottomN[BottomNav]
        Page[PageLayout]
    end

    subgraph Pages
        P1[Home]
        P2[Capture]
        P3[Search]
        P4[AIChat]
    end

    T --> B
    B --> Primitives
    Primitives --> Composites
    Composites --> Features
    Features --> Layouts
    Layouts --> Pages

    style T fill:#eef2ff
    style B fill:#e0e7ff
    style Primitives fill:#c7d2fe
    style Composites fill:#a5b4fc
    style Features fill:#818cf8
    style Layouts fill:#6366f1
    style Pages fill:#4f46e5
```

## Page Flow & Navigation

```mermaid
graph TD
    Start[App Launch] --> Home[Home Page]

    Home --> Capture[Capture Page]
    Home --> Search[Search Page]
    Home --> AIChat[AI Chat Page]
    Home --> Settings[Settings Page]
    Home --> Analytics[Analytics Page]
    Home --> Bookmarks[Bookmarks Page]
    Home --> Collections[Collections Page]
    Home --> ForYou[For You Page]

    Capture --> Conversation[Conversation View]
    Search --> Conversation
    Home --> Conversation
    Bookmarks --> Conversation
    Collections --> Conversation
    ForYou --> Conversation

    Conversation --> Share[Share Page]
    Conversation --> Receive[Receive Page]

    Settings --> AISettings[AI Settings]
    Settings --> Privacy[Privacy Settings]
    Settings --> Appearance[Appearance Settings]

    Share --> Home
    Receive --> Home
    Conversation --> Home
    AISettings --> Settings

    style Start fill:#6366f1
    style Home fill:#818cf8
    style Capture fill:#a5b4fc
    style Search fill:#a5b4fc
    style AIChat fill:#a5b4fc
    style Settings fill:#a5b4fc
    style Analytics fill:#a5b4fc
    style Bookmarks fill:#a5b4fc
    style Collections fill:#a5b4fc
    style ForYou fill:#a5b4fc
    style Conversation fill:#c7d2fe
    style Share fill:#c7d2fe
    style Receive fill:#c7d2fe
```

## State Management Flow

```mermaid
graph LR
    subgraph UI[UI Components]
        Comp[Components]
        Pages[Pages]
    end

    subgraph State[State Management]
        Zustand[Zustand Stores]
        ReactQuery[React Query]
    end

    subgraph Data[Data Layer]
        IndexedDB[IndexedDB]
        API[API Services]
        Storage[Storage V2]
    end

    subgraph Sync[Background Sync]
        SW[Service Worker]
        Queue[Capture Queue]
    end

    Comp --> Zustand
    Pages --> Zustand
    Comp --> ReactQuery
    Pages --> ReactQuery

    Zustand --> IndexedDB
    Zustand --> Storage
    ReactQuery --> API

    Queue --> SW
    SW --> API
    API --> IndexedDB

    style UI fill:#6366f1
    style State fill:#8b5cf6
    style Data fill:#10b981
    style Sync fill:#f59e0b
```

## Theme System

```mermaid
graph TB
    subgraph ThemeEngine[Theme Engine]
        Provider[ThemeProvider]
        Hook[useTheme Hook]
        Storage[Theme Storage]
    end

    subgraph Themes[Available Themes]
        Light[Light Mode]
        Dark[Dark Mode]
        Auto[Auto/System]
    end

    subgraph Tokens[Theme Tokens]
        Colors[Color Tokens]
        Typography[Typography Tokens]
        Spacing[Spacing Tokens]
        Shadows[Shadow Tokens]
    end

    subgraph Components[Themed Components]
        Buttons[Themed Buttons]
        Cards[Themed Cards]
        Inputs[Themed Inputs]
        Modals[Themed Modals]
    end

    Provider --> Hook
    Hook --> Storage
    Hook --> Themes

    Themes --> Tokens
    Tokens --> Components

    style ThemeEngine fill:#6366f1
    style Themes fill:#8b5cf6
    style Tokens fill:#10b981
    style Components fill:#f59e0b
```

## Animation System

```mermaid
graph LR
    subgraph AnimationTypes[Animation Types]
        Micro[Micro Interactions]
        Page[Page Transitions]
        Loading[Loading States]
        Feedback[Feedback Animations]
    end

    subgraph MicroAnimations[Micro Animations]
        Button[Button Press]
        Card[Card Hover]
        Input[Input Focus]
        Ripple[Ripple Effect]
    end

    subgraph PageAnimations[Page Animations]
        Slide[Slide]
        Fade[Fade]
        Scale[Scale]
        Flip[Flip]
    end

    subgraph LoadingAnimations[Loading Animations]
        Spinner[Spinner]
        Skeleton[Skeleton Shimmer]
        Progress[Progress Bar]
        Pulse[Pulse]
    end

    subgraph FeedbackAnimations[Feedback Animations]
        Success[Success Check]
        Error[Error Shake]
        Notification[Notification Slide]
        Haptic[Haptic Feedback]
    end

    Micro --> MicroAnimations
    Page --> PageAnimations
    Loading --> LoadingAnimations
    Feedback --> FeedbackAnimations

    style AnimationTypes fill:#6366f1
    style MicroAnimations fill:#8b5cf6
    style PageAnimations fill:#10b981
    style LoadingAnimations fill:#f59e0b
    style FeedbackAnimations fill:#ef4444
```

## Responsive Breakpoints

```mermaid
graph TB
    subgraph Breakpoints[Breakpoints]
        XS[XS: 375px]
        SM[SM: 640px]
        MD[MD: 768px]
        LG[LG: 1024px]
        XL[XL: 1280px]
        XXL[2XL: 1536px]
    end

    subgraph Layouts[Layout Adaptations]
        Mobile[Mobile Layout]
        Tablet[Tablet Layout]
        Desktop[Desktop Layout]
    end

    subgraph Features[Responsive Features]
        Nav[Navigation Type]
        Grid[Grid Columns]
        Spacing[Spacing Scale]
        Font[Font Size]
    end

    XS --> Mobile
    SM --> Mobile
    MD --> Tablet
    LG --> Desktop
    XL --> Desktop
    XXL --> Desktop

    Mobile --> Features
    Tablet --> Features
    Desktop --> Features

    style Breakpoints fill:#6366f1
    style Layouts fill:#8b5cf6
    style Features fill:#10b981
```

## Component Variant System

```mermaid
graph TD
    subgraph Component[Button Component]
        Base[Base Button]
    end

    subgraph Variants[Variants]
        Primary[Primary]
        Secondary[Secondary]
        Ghost[Ghost]
        Destructive[Destructive]
        Link[Link]
    end

    subgraph Sizes[Sizes]
        SM[Small]
        MD[Medium]
        LG[Large]
        XL[Extra Large]
    end

    subgraph States[States]
        Default[Default]
        Hover[Hover]
        Active[Active]
        Disabled[Disabled]
        Loading[Loading]
    end

    Base --> Variants
    Variants --> Sizes
    Sizes --> States

    style Component fill:#6366f1
    style Variants fill:#8b5cf6
    style Sizes fill:#10b981
    style States fill:#f59e0b
```

## File Structure

```mermaid
graph TD
    subgraph src[src]
        components[components]
        pages[pages]
        styles[styles]
        hooks[hooks]
        lib[lib]
        types[types]
    end

    subgraph ComponentsStructure[components]
        ui[ui]
        layout[layout]
        features[features]
    end

    subgraph UI[ui]
        Button[Button]
        Card[Card]
        Input[Input]
        Modal[Modal]
        Badge[Badge]
        Avatar[Avatar]
        Skeleton[Skeleton]
        Toast[Toast]
        Progress[Progress]
        Empty[EmptyState]
    end

    subgraph Layout[layout]
        TopBar[TopBar]
        BottomNav[BottomNav]
        Container[Container]
        Header[Header]
        Footer[Footer]
    end

    subgraph Features[features]
        ConversationCard[ConversationCard]
        MessageBubble[MessageBubble]
        SearchBar[SearchBar]
        CaptureFlow[CaptureFlow]
        AIResponse[AIResponse]
    end

    subgraph Styles[styles]
        DesignSystem[design-system.css]
        Theme[theme.css]
        Animations[animations.css]
        Utilities[utilities.css]
    end

    components --> ComponentsStructure
    ComponentsStructure --> UI
    ComponentsStructure --> Layout
    ComponentsStructure --> Features
    styles --> Styles

    style src fill:#6366f1
    style ComponentsStructure fill:#8b5cf6
    style UI fill:#10b981
    style Layout fill:#f59e0b
    style Features fill:#ef4444
    style Styles fill:#06b6d4
```
