'use client';

import React from 'react';
import { Modal, Input, Typography, Select, Tag } from 'antd';

const { Text } = Typography;

interface ImageGenerationModalProps {
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
  confirmLoading: boolean;
  imagePrompt: string;
  setImagePrompt: (value: string) => void;
  selectedImageModel: string;
  setSelectedImageModel: (value: string) => void;
  imageModels: any[];
  error: string | null;
}

export const ImageGenerationModal: React.FC<ImageGenerationModalProps> = ({
  open,
  onOk,
  onCancel,
  confirmLoading,
  imagePrompt,
  setImagePrompt,
  selectedImageModel,
  setSelectedImageModel,
  imageModels,
  error,
}) => {
  return (
    <Modal
      title="Generate Image"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okText="Generate"
      width={500}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px 0' }}>
        <div>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>Prompt</Text>
          <Input.TextArea 
            placeholder="Describe the image you want to generate..." 
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            rows={4}
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </div>
        <div>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>Model</Text>
          <Select
            style={{ width: '100%' }}
            value={selectedImageModel}
            onChange={setSelectedImageModel}
            options={imageModels.map(m => ({ label: m.name, value: m.id }))}
            placeholder="Select a model"
          />
        </div>
        {error && (
          <Tag color="error" style={{ width: '100%', padding: '8px', whiteSpace: 'normal' }}>
            {error}
          </Tag>
        )}
      </div>
    </Modal>
  );
};
