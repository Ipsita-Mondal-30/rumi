import React from 'react';
import { Users } from 'lucide-react';
import { RecommendedRoomCard } from './RecommendedRoomCard';
import { RoomDetailsModal } from './RoomDetailsModal';

export type RecommendedRoomsSectionProps = {
  rooms: any[];
  loading: boolean;
  title?: string;
};

export const RecommendedRoomsSection = ({
  rooms,
  loading,
  title = 'Recommended Rooms',
}: RecommendedRoomsSectionProps) => {
  const [open, setOpen] = React.useState(false);
  const [selectedRoom, setSelectedRoom] = React.useState<any | null>(null);

  return (
    <div className="mt-6">
      <div className="flex items-end justify-between gap-4 mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">Sorted by compatibility</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-gray-500">
          <Users size={36} className="mr-3" />
          Loading rooms…
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-sm text-gray-500">No recommended rooms found.</div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-4">
            {rooms.map((room) => (
              <RecommendedRoomCard
                key={room._id}
                room={room}
                onViewDetails={(r) => {
                  setSelectedRoom(r);
                  setOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      <RoomDetailsModal open={open} room={selectedRoom} onClose={() => setOpen(false)} />
    </div>
  );
};

