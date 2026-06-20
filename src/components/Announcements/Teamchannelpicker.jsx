import { MOCK_TEAMS } from "../mock_dataset/Data_admin_alert";
import { getchannelsforteam } from "./healpers";

export default function Teamchannelpicker({ teamId, channelId, onChange }) {
    const teams = MOCK_TEAMS;
    const channels = getchannelsforteam(teamId);

    function handleteamchange(e) {
        onChange({ teamId: e.target.value, channelId: "" });
    }

    function handlechannelchange(e) {
        onChange({ teamId, channelId: e.target.value });
    }

    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
                <label className="form-label" htmlFor="sel-team">
                    Target team
                </label>
                <select
                    id="sel-team"
                    value={teamId}
                    onChange={handleteamchange}
                    className="input-control"
                >
                    <option value="">Select team</option>
                    {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="sel-channel" className="form-label">
                    Target channel
                </label>
                <select
                    id="sel-channel"
                    value={channelId}
                    onChange={handlechannelchange}
                    disabled={!teamId}
                    className="input-control"
                >
                    <option value="">select channel</option>
                    {channels.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
