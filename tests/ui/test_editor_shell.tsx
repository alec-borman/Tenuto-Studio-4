import { test, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Workspace } from '../../src/components/layout/Workspace';

test('instantiates physical resizable panels with correct ARIA roles', async () => {
    const { container } = render(<Workspace />);

    // Top Bar -> role="banner"
    expect(screen.getByRole('banner')).toBeInTheDocument();
    
    // Bottom Bar -> role="contentinfo"
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();

    // Main layout -> role="main"
    expect(screen.getByRole('main')).toBeInTheDocument();

    // Sidebars -> role="complementary"
    const sidebars = screen.getAllByRole('complementary');
    expect(sidebars.length).toBeGreaterThanOrEqual(2);

    // react-resizable-panels structure validation
    const panelGroups = container.querySelectorAll('[data-group]');
    expect(panelGroups.length).toBeGreaterThanOrEqual(1);

    const panels = container.querySelectorAll('[data-panel]');
    expect(panels.length).toBeGreaterThanOrEqual(2);
    
    // Split pane handle validation
    const handles = container.querySelectorAll('div[role="separator"]');
    expect(handles.length).toBeGreaterThanOrEqual(1);
    
    // Explicit Component Testing for Top Bar Standard Profile B (TENUTO-STEEL-1046) 
    expect(screen.getByLabelText('App Title')).toHaveTextContent('TENUTO STUDIO 4.0');
    expect(screen.getByRole('combobox', { name: "Profile Selector" })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: "Transport Controls" })).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: "Play/Pause" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Stop" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Record" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Loop" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Metronome" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Share/Export Menu" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Save Local Workspace" })).toBeInTheDocument();
    
    // Asserting the exact string for Tempo and Time Signature
    expect(screen.getByText('120.0 BPM')).toBeInTheDocument();
    expect(screen.getByText('4/4')).toBeInTheDocument();

    // TENUTO-STEEL-1051 Modal Matrix Assertions
    const exportBtn = screen.getByRole('button', { name: "Share/Export Menu" });
    fireEvent.click(exportBtn);
    let dialogs = await screen.findAllByRole('dialog');
    expect(dialogs.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Universal Render Dialog')).toBeInTheDocument();

    // Close the dialog using escape
    fireEvent.keyDown(dialogs[0], { key: 'Escape', code: 'Escape' });
    await waitFor(() => {
        expect(screen.queryByText('Universal Render Dialog')).not.toBeInTheDocument();
    });

    const settingsBtn = screen.getByRole('button', { name: "Settings" });
    fireEvent.click(settingsBtn);
    dialogs = await screen.findAllByRole('dialog');
    expect(dialogs.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Preferences Modal')).toBeInTheDocument();
});
