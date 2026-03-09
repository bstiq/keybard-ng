import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import KeyboardViewInstance from '../../src/layout/KeyboardViewInstance';

const mockLayoutSettings = vi.hoisted(() => ({
  is3DMode: false,
  keyVariant: 'default',
}));

vi.mock('@/contexts/VialContext', () => ({
  useVial: () => ({
    keyboard: {
      rows: 1,
      cols: 1,
      layers: 2,
      keymap: [[4], [4]],
      cosmetic: { layer: {}, layer_colors: {} },
    },
    updateKey: vi.fn(),
    setKeyboard: vi.fn(),
    activeLayerIndex: 0,
    isConnected: false,
  }),
}));

vi.mock('@/contexts/KeyBindingContext', () => ({
  useKeyBinding: () => ({
    clearSelection: vi.fn(),
  }),
}));

vi.mock('@/contexts/ChangesContext', () => ({
  useChanges: () => ({
    queue: vi.fn(),
  }),
}));

vi.mock('@/contexts/LayoutSettingsContext', () => ({
  useLayoutSettings: () => mockLayoutSettings,
}));

vi.mock('@/contexts/PanelsContext', () => ({
  usePanels: () => ({
    activePanel: null,
  }),
}));

vi.mock('@/components/Keyboard', () => ({
  Keyboard: () => <div data-testid="mock-keyboard" className="pointer-events-auto">keyboard</div>,
}));

vi.mock('@/components/LayerNameBadge', () => ({
  LayerNameBadge: ({ trailingAction }: { trailingAction?: ReactNode }) => (
    <div data-testid="mock-layer-badge">
      badge
      {trailingAction}
    </div>
  ),
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/context-menu', () => ({
  ContextMenu: ({ children }: { children: ReactNode }) => <>{children}</>,
  ContextMenuTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  ContextMenuContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  ContextMenuItem: ({ children }: { children: ReactNode }) => <>{children}</>,
  ContextMenuSeparator: () => null,
}));

vi.mock('@/services/sval.service', () => ({
  svalService: {
    getLayerName: (_keyboard: unknown, layer: number) => `Layer ${layer}`,
    getLayerNameNoLabel: (_keyboard: unknown, layer: number) => `${layer}`,
  },
}));

describe('KeyboardViewInstance layer drop surface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLayoutSettings.is3DMode = false;
    mockLayoutSettings.keyVariant = 'default';
  });

  const renderComponent = (props?: Partial<ComponentProps<typeof KeyboardViewInstance>>) => {
    const onLayerDropHover = vi.fn();
    const onLayerDrop = vi.fn();

    const view = render(
      <KeyboardViewInstance
        instanceId="test"
        selectedLayer={1}
        setSelectedLayer={vi.fn()}
        isPrimary={true}
        hideLayerTabs={true}
        layerActiveState={[true, false]}
        onToggleLayerOn={vi.fn()}
        transparencyByLayer={{}}
        onToggleTransparency={vi.fn()}
        showAllLayers={true}
        onToggleShowLayers={vi.fn()}
        isLayerOrderReversed={false}
        onToggleLayerOrder={vi.fn()}
        isMultiLayersActive={true}
        isAllTransparencyActive={false}
        onLayerDropHover={onLayerDropHover}
        onLayerDrop={onLayerDrop}
        {...props}
      />
    );

    const surface = view.container.querySelector('[data-layer-drop-surface="1"]');
    if (!(surface instanceof HTMLElement)) {
      throw new Error('Layer drop surface not found');
    }

    return {
      ...view,
      surface,
      onLayerDropHover,
      onLayerDrop,
    };
  };

  it('keeps the layer-wide drop surface inert when a layer drag is not active', () => {
    const { surface } = renderComponent({ isLayerDragActive: false });

    expect(surface).toHaveAttribute('data-drop-surface-active', 'false');
    expect(surface).toHaveClass('pointer-events-none');
    expect(screen.getByTestId('mock-keyboard')).toBeInTheDocument();
  });

  it('activates the layer-wide drop surface only during layer drags', () => {
    const { surface, onLayerDropHover, onLayerDrop } = renderComponent({ isLayerDragActive: true });

    expect(surface).toHaveAttribute('data-drop-surface-active', 'true');
    expect(surface).toHaveClass('pointer-events-auto');

    fireEvent.mouseEnter(surface);
    fireEvent.mouseUp(surface);

    expect(onLayerDropHover).toHaveBeenCalledWith(1);
    expect(onLayerDrop).toHaveBeenCalledWith(1);
  });

  it('keeps the legacy layer-wide drop surface inert in 3D mode', () => {
    mockLayoutSettings.is3DMode = true;

    const { surface } = renderComponent({ isLayerDragActive: true });

    expect(surface).toHaveAttribute('data-drop-surface-active', 'false');
    expect(surface).toHaveClass('pointer-events-none');
  });
});
