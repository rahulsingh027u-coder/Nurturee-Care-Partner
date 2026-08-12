'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Siren,
  PhoneCall,
  Phone,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { NURTUREE_HELPLINE } from '@/lib/constants';

interface SOSEmergencyDialogProps {
  open: boolean;
  onClose: () => void;
  patientName?: string;
  patientEmergencyContact?: string;
}

export default function SOSEmergencyDialog({
  open,
  onClose,
  patientName,
  patientEmergencyContact,
}: SOSEmergencyDialogProps) {
  const [triggered, setTriggered] = useState(false);

  const handleTrigger = () => {
    setTriggered(true);
    // TODO: Send SOS payload to backend — shift ID, GPS coordinates, patient ID, timestamp
  };

  const handleClose = () => {
    setTriggered(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <div className="flex flex-col items-center text-center py-2">
          {/* SOS Icon */}
          <div className="relative mb-3">
            <div className="flex size-16 items-center justify-center rounded-full bg-red-600 shadow-lg shadow-red-600/30">
              <Siren className="size-8 text-white" />
            </div>
          </div>

          <DialogHeader className="text-center space-y-1">
            <DialogTitle className="text-xl text-red-800">
              {triggered ? 'SOS Alert Sent' : 'SOS Emergency Alert'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {triggered
                ? 'Our emergency response team has been notified. Help is on the way.'
                : 'This will immediately alert the Nurturee emergency team and notify the patient\'s emergency contact.'}
            </DialogDescription>
          </DialogHeader>

          {!triggered && (
            <div className="w-full space-y-3 mt-4">
              {/* Warning details */}
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-2 text-left">
                <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">
                  This alert will connect you to:
                </p>
                <div className="flex items-center gap-2 text-xs text-red-700">
                  <ShieldCheck className="size-3.5 shrink-0" />
                  <span>Nurturee Emergency Helpline (24/7)</span>
                </div>
                {patientName && (
                  <div className="flex items-center gap-2 text-xs text-red-700">
                    <Phone className="size-3.5 shrink-0" />
                    <span>{patientName}&apos;s Emergency Contact</span>
                  </div>
                )}
                <div className="border-t border-red-200 pt-2 mt-2">
                  <p className="text-[11px] text-red-600">
                    In a life-threatening emergency, also call:
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <a
                      href="tel:108"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-800 hover:underline"
                    >
                      <PhoneCall className="size-3" />
                      Ambulance 108
                    </a>
                    <a
                      href="tel:112"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-800 hover:underline"
                    >
                      <PhoneCall className="size-3" />
                      Emergency 112
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {triggered && (
            <div className="w-full space-y-3 mt-4">
              {/* Success message */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-start gap-2">
                <CheckCircle className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-700">
                  <p className="font-medium">Alert acknowledged</p>
                  <p className="text-emerald-600 mt-0.5">
                    Our team will contact you within 2 minutes. Stay on the line if possible.
                  </p>
                </div>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={NURTUREE_HELPLINE}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 p-3 hover:bg-red-100 transition-colors"
                >
                  <PhoneCall className="size-5 text-red-600" />
                  <span className="text-xs font-medium text-red-700">Call Helpline</span>
                </a>
                {patientEmergencyContact && (
                  <a
                    href={`tel:${patientEmergencyContact}`}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 p-3 hover:bg-amber-100 transition-colors"
                  >
                    <Phone className="size-5 text-amber-600" />
                    <span className="text-xs font-medium text-amber-700">Patient Contact</span>
                  </a>
                )}
                {!patientEmergencyContact && (
                  <a
                    href="tel:112"
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 p-3 hover:bg-blue-100 transition-colors"
                  >
                    <PhoneCall className="size-5 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">Call 112</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          {!triggered ? (
            <>
              <Button
                onClick={handleTrigger}
                className="w-full bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 gap-2 h-11 text-sm font-semibold"
              >
                <Siren className="size-4" />
                Trigger SOS Alert
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              onClick={handleClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CheckCircle className="size-4 mr-2" />
              I&apos;m Safe — Close Alert
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
