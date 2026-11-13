"use client";
import { Component, type ReactNode } from "react";
export class SectionBoundary extends Component<{ children: ReactNode; es: boolean; onReturn: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <section className="live-card" role="alert">
      <p>{this.props.es ? "No se pudo abrir esta sección. Los datos que está editando se mantienen en el formulario. Compruebe su conexión y reintente." : "This section could not be opened. Your edits remain in the form. Check your connection and retry."}</p>
      <div className="list-navigation">
        <button type="button" className="button primary" onClick={() => this.setState({ failed: false })}>{this.props.es ? "Reintentar" : "Retry"}</button>
        <button type="button" className="button secondary" onClick={this.props.onReturn}>{this.props.es ? "Volver a información general" : "Back to general information"}</button>
      </div>
    </section>;
  }
}
