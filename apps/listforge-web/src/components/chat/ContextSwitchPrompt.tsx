import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@listforge/ui';
import { useChat } from '../../contexts/ChatContext';

export function ContextSwitchPrompt() {
  const { pendingContextSwitch, confirmContextSwitch, cancelContextSwitch } = useChat();

  if (!pendingContextSwitch) return null;

  return (
    <AlertDialog open={!!pendingContextSwitch} onOpenChange={(open) => !open && cancelContextSwitch()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Switch conversation?</AlertDialogTitle>
          <AlertDialogDescription>
            You're now viewing <strong>{pendingContextSwitch.to}</strong>.
            <br />
            <br />
            Would you like to switch from "{pendingContextSwitch.from}" to a conversation
            relevant to this page?
            <br />
            <br />
            Your current conversation will be saved and you can return to it anytime.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={cancelContextSwitch}>
            Stay on current conversation
          </AlertDialogCancel>
          <AlertDialogAction onClick={confirmContextSwitch}>
            Switch conversation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
