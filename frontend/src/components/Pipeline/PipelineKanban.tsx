import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip,
  LinearProgress
} from '@mui/material';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import type { DropResult } from 'react-beautiful-dnd';
import { DealCard } from './DealCard';
import type { KanbanData, PipelineDeal } from '../../types/pipeline';
import { DealStage } from '../../types/pipeline';

interface PipelineKanbanProps {
  data: KanbanData;
  onStageChange: (dealId: string, newStage: DealStage) => Promise<void>;
  onDeleteDeal: (dealId: string) => Promise<void>;
  onAnalyzeDeal: (deal: PipelineDeal) => void;
  onEditDeal: (deal: PipelineDeal) => void;
  loading: boolean;
}

export const PipelineKanban: React.FC<PipelineKanbanProps> = ({
  data,
  onStageChange,
  onDeleteDeal,
  onAnalyzeDeal,
  onEditDeal,
  loading
}) => {
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null);

  // Stage configuration
  const stages = [
    { id: DealStage.WATCHING, title: 'Watching', color: '#6b7280' },
    { id: DealStage.ANALYZING, title: 'Analyzing', color: '#2563eb' },
    { id: DealStage.NEGOTIATING, title: 'Negotiating', color: '#d97706' },
    { id: DealStage.UNDER_CONTRACT, title: 'Under Contract', color: '#059669' },
    { id: DealStage.CLOSED, title: 'Closed', color: '#047857' },
    { id: DealStage.LOST, title: 'Lost', color: '#dc2626' }
  ];

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    setDraggedDeal(null);

    if (!destination) return;
    
    // If dropped in the same place, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Update the deal stage
    const newStage = destination.droppableId as DealStage;
    onStageChange(draggableId, newStage);
  };

  const handleDragStart = (start: any) => {
    setDraggedDeal(start.draggableId);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Loading progress */}
      {loading && <LinearProgress />}
      
      <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 2,
            minHeight: '70vh'
          }}
        >
          {stages.map(stage => (
            <StageColumn
              key={stage.id}
              stage={stage}
              deals={data[stage.id] || []}
              onDeleteDeal={onDeleteDeal}
              onAnalyzeDeal={onAnalyzeDeal}
              onEditDeal={onEditDeal}
              isDragging={draggedDeal !== null}
            />
          ))}
        </Box>
      </DragDropContext>
    </Box>
  );
};

interface StageColumnProps {
  stage: { id: DealStage; title: string; color: string };
  deals: PipelineDeal[];
  onDeleteDeal: (dealId: string) => Promise<void>;
  onAnalyzeDeal: (deal: PipelineDeal) => void;
  onEditDeal: (deal: PipelineDeal) => void;
  isDragging: boolean;
}

const StageColumn: React.FC<StageColumnProps> = ({ 
  stage, 
  deals, 
  onDeleteDeal,
  onAnalyzeDeal,
  onEditDeal,
  isDragging 
}) => {
  const totalValue = deals.reduce((sum, deal) => sum + deal.askingPrice, 0);

  return (
    <Paper 
      sx={{ 
        p: 2, 
        borderTop: `3px solid ${stage.color}`,
        backgroundColor: '#fafafa',
        height: 'fit-content',
        minHeight: '500px'
      }}
    >
      {/* Stage Header */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: stage.color }}>
            {stage.title}
          </Typography>
          <Chip 
            label={deals.length} 
            size="small" 
            sx={{ 
              backgroundColor: stage.color, 
              color: 'white',
              fontWeight: 600 
            }} 
          />
        </Box>
        
        <Typography variant="caption" color="textSecondary">
          Total: ${(totalValue / 1000000).toFixed(2)}M
        </Typography>
      </Box>

      {/* Droppable Area */}
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              minHeight: 400,
              backgroundColor: snapshot.isDraggingOver ? 'rgba(0,0,0,0.05)' : 'transparent',
              borderRadius: 1,
              transition: 'background-color 0.2s',
              p: 1
            }}
          >
            {deals.map((deal, index) => (
              <DealCard
                key={deal._id}
                deal={deal}
                index={index}
                onDelete={onDeleteDeal}
                onAnalyze={onAnalyzeDeal}
                onEdit={onEditDeal}
                isDragging={isDragging}
              />
            ))}
            {provided.placeholder}
            
            {/* Empty state */}
            {deals.length === 0 && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 200,
                  color: 'text.secondary',
                  border: '2px dashed #e0e0e0',
                  borderRadius: 1,
                  backgroundColor: snapshot.isDraggingOver ? 'rgba(0,0,0,0.02)' : 'transparent'
                }}
              >
                <Typography variant="body2">
                  {snapshot.isDraggingOver ? 'Drop here' : 'No deals'}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Droppable>
    </Paper>
  );
};