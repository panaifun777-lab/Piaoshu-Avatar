# Task 12 - Notification Center Developer

## Task
Add a Notification Center dropdown in the header bar with real-time notifications from the system.

## Files Created
1. `/home/z/my-project/src/lib/notification-store.ts` - Zustand store for notifications
2. `/home/z/my-project/src/components/piaoshu/notification-center.tsx` - Notification center UI component

## Files Modified
1. `/home/z/my-project/src/app/page.tsx` - Added NotificationCenter to header + WS event → notification store connection

## Implementation Details

### notification-store.ts
- Zustand store with 5 actions: addNotification, markAsRead, markAllAsRead, clearAll, removeNotification
- Computed unreadCount via getter function
- Max 50 notifications with auto-pruning
- 9 notification types mapped from WS events
- mapWSEventToNotification() utility to convert WS events to notification objects with Chinese labels

### notification-center.tsx
- Bell icon with animated rose-500 unread count badge
- Popover (shadcn/ui) with 380px width
- Color-coded left borders per notification type (9 colors)
- Type-specific icons with colored backgrounds
- Chinese relative timestamps (刚刚, X分钟前, X小时前, X天前)
- ScrollArea with max-h-[420px]
- Mark all as read + Clear all buttons
- Empty state with Inbox icon
- Click notification → navigate to module + close popover + mark as read

### page.tsx integration
- NotificationCenter added in header between Phase/Day info and auth button
- WebSocket events now also add to notification store via mapWSEventToNotification
- onNavigate callback connects to setActiveModule

## Lint Status
- Zero new lint errors in notification files
- Pre-existing lint errors in other files remain unchanged
