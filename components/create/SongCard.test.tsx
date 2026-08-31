import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SongCard } from "./SongCard";
import type { ResolvedSong } from "@/lib/music/types";

const baseSong: ResolvedSong = {
  id: "1",
  title: "Golden",
  artist: "Harry Styles",
  why: "Warm, unhurried tempo.",
  platform: "spotify",
  externalUrl: "https://open.spotify.com/track/1",
};

beforeAll(() => {
  window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = jest.fn();
});

describe("SongCard (SHORTLIST-01/02/03/05)", () => {
  it("renders title, artist, and the why-text", () => {
    render(
      <ul>
        <SongCard song={baseSong} selected={false} isPlaying={false} onSelect={jest.fn()} onPreviewToggle={jest.fn()} />
      </ul>,
    );
    expect(screen.getByText("Golden")).toBeInTheDocument();
    expect(screen.getByText("Harry Styles")).toBeInTheDocument();
    expect(screen.getByText(/Warm, unhurried tempo/)).toBeInTheDocument();
  });

  it("shows selection via icon + text + aria-pressed together, not color alone", async () => {
    const onSelect = jest.fn();
    const { rerender } = render(
      <ul>
        <SongCard song={baseSong} selected={false} isPlaying={false} onSelect={onSelect} onPreviewToggle={jest.fn()} />
      </ul>,
    );

    const selectButton = screen.getByRole("button", { name: "Select" });
    expect(selectButton).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(selectButton);
    expect(onSelect).toHaveBeenCalledTimes(1);

    rerender(
      <ul>
        <SongCard song={baseSong} selected={true} isPlaying={false} onSelect={onSelect} onPreviewToggle={jest.fn()} />
      </ul>,
    );
    const selectedButton = screen.getByRole("button", { name: "✓ Selected" });
    expect(selectedButton).toHaveAttribute("aria-pressed", "true");
  });

  it("opens the external platform when there is no in-app preview clip", async () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    const song = { ...baseSong, previewUrl: undefined };
    render(
      <ul>
        <SongCard song={song} selected={false} isPlaying={false} onSelect={jest.fn()} onPreviewToggle={jest.fn()} />
      </ul>,
    );

    await userEvent.click(screen.getByRole("button", { name: /Open on Spotify/ }));
    expect(openSpy).toHaveBeenCalledWith(song.externalUrl, "_blank", "noopener,noreferrer");
    openSpy.mockRestore();
  });

  it("toggles the in-app preview when a clip is available", async () => {
    const onPreviewToggle = jest.fn();
    const song = { ...baseSong, previewUrl: "https://p.scdn.co/preview/1" };
    render(
      <ul>
        <SongCard song={song} selected={false} isPlaying={false} onSelect={jest.fn()} onPreviewToggle={onPreviewToggle} />
      </ul>,
    );

    await userEvent.click(screen.getByRole("button", { name: "▷ Preview" }));
    expect(onPreviewToggle).toHaveBeenCalledTimes(1);
  });

  it("disables preview and select, and explains why, when the song is unavailable (SHORTLIST-05)", () => {
    const song = { ...baseSong, unavailable: true };
    render(
      <ul>
        <SongCard song={song} selected={false} isPlaying={false} onSelect={jest.fn()} onPreviewToggle={jest.fn()} />
      </ul>,
    );

    expect(screen.getByRole("button", { name: "Preview unavailable" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Select" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(/Not available in your region/);
  });

  it("shows a region-locked note without disabling the card when an alternate link was found", () => {
    const song = { ...baseSong, platform: "youtube" as const, regionLocked: true };
    render(
      <ul>
        <SongCard song={song} selected={false} isPlaying={false} onSelect={jest.fn()} onPreviewToggle={jest.fn()} />
      </ul>,
    );

    expect(screen.getByText(/showing the YouTube link instead/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select" })).not.toBeDisabled();
  });
});
