'use client';

import { IconBuilding, IconMapPin, IconVideo, IconCircleFilled, IconTrash } from '@tabler/icons-react';
import type { User } from '@/types';

interface ClientListProps {
  clients: User[];
  selectedClient: User | null;
  onSelectClient: (client: User) => void;
  onDeleteClient: (clientId: string) => void;
}

export default function ClientList({ clients, selectedClient, onSelectClient, onDeleteClient }: ClientListProps) {
  if (clients.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 text-sm">No clients found</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      {clients.map((client) => {
        const isSelected = selectedClient?.id === client.id;
        const cameraCount = client.store?.cameras?.length || 0;
        const activeCameras = client.store?.cameras?.filter(c => c.status === 'ACTIVE').length || 0;
        
        return (
          <button
            key={client.id}
            onClick={() => onSelectClient(client)}
            className={`w-full p-3 rounded-lg text-left transition-all group ${
              isSelected 
                ? 'bg-primary text-primary-foreground shadow-md' 
                : 'hover:bg-accent border border-transparent'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isSelected 
                  ? 'bg-primary-foreground/10' 
                  : 'bg-muted'
              }`}>
                <IconBuilding className={`w-4 h-4 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} stroke={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate text-sm mb-0.5 font-serif ${
                  isSelected ? 'text-primary-foreground' : 'text-foreground'
                }`}>
                  {client.store?.name || 'Unnamed Store'}
                </p>
                <p className={`text-xs truncate mb-2 ${
                  isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}>{client.email}</p>
                
                {client.store?.address && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <IconMapPin className={`w-3 h-3 flex-shrink-0 ${
                      isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`} stroke={1.5} />
                    <p className={`text-xs truncate ${
                      isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>{client.store.address}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <IconVideo className={`w-3.5 h-3.5 ${
                      isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`} stroke={1.5} />
                    <p className="text-xs">
                      <span className={`font-medium ${
                        isSelected 
                          ? 'text-primary-foreground'
                          : (activeCameras > 0 ? 'text-foreground' : 'text-muted-foreground')
                      }`}>
                        {activeCameras}
                      </span>
                      <span className={isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}>/{cameraCount}</span>
                    </p>
                  </div>
                  {activeCameras > 0 && (
                    <div className="flex items-center gap-1">
                      <IconCircleFilled className={`w-2 h-2 ${
                        isSelected ? 'text-primary-foreground' : 'text-green-500'
                      }`} />
                      <span className={`text-xs font-medium ${
                        isSelected ? 'text-primary-foreground' : 'text-green-500'
                      }`}>Live</span>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Are you sure you want to delete ${client.store?.name || client.email}? This will permanently delete all their data including cameras and alerts.`)) {
                    onDeleteClient(client.id);
                  }
                }}
                className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                  isSelected
                    ? 'hover:bg-primary-foreground/10 text-primary-foreground'
                    : 'hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100'
                }`}
                title="Delete client"
              >
                <IconTrash className="w-4 h-4" stroke={1.5} />
              </button>
            </div>
          </button>
        );
      })}
    </div>
  );
}
