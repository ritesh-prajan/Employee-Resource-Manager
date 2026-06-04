import React , {useState}from 'react';
import { useApp } from '../../context/AppContext';
import FilterBar from '../../components/ui/FilterBar';
import UserAvatar from '../../components/ui/UserAvatar';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import TeamForm from '../../components/forms/TeamForm';

export default function Teams(){
        const { users, teams, createTeam, editTeam, deleteTeam } = useApp();
        const [formData, setFormData] = useState({ name: '', leadId: '', members: [] });
        const [editingTeam, setEditingTeam] = useState(null);
        const [showModal, setShowModal] = useState(false);
        const [confirmDelete, setConfirmDelete] = useState(null);

        /*DECIDE IF CREATE OR EDIT*/
        const handleSubmit = () => {
            if (editingTeam) {
                editTeam(editingTeam.id, formData);
            } else {
                createTeam(formData);
            }
            setShowModal(false);
            setEditingTeam(null);
            setFormData({ name: '', leadId: '', members: [] });
            };

        /*HANDLE EDIT*/
        const handleEdit = (team) => {
            setEditingTeam(team);
            setFormData({ name: team.name, leadId: team.leadId, members: team.members });
            setShowModal(true);
        };

        /*HANDLE DELETE*/
        const handleDelete = () => {
            deleteTeam(confirmDelete.id);
            setConfirmDelete(null);
        };
        
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Teams Dashboard</h2>
                    <span>Manage and view all department teams, assigned leads, and Team members.</span>
                </div>
                <button className="btn btn-primary" onClick={()=>setShowModal(true)}>
                    + Create Team
                </button>
                </div>

                {/* FilterBar */}
                <FilterBar
                searchValue={''}
                onSearchChange={() => {}}
                filters={[]}
                placeholder="Search teams..."
                />

                {/* Table - handled by teammate */}
                {/* TODO: TanStack table goes here */}
                
                {/* Modal */}
                    <Modal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="460px">
                        <div className="modal-header">
                            <h3 className="modal-title">{editingTeam ? 'Edit Team' : 'Create Team'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <TeamForm
                            formData={formData}
                            onChange={setFormData}
                            users={users}
                        />

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSubmit}>
                            {editingTeam ? 'Save Changes' : 'Create Team'}
                            </button>
                        </div>
                    </Modal>
                    
                {/* ConfirmDialog */}
                <ConfirmDialog
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleDelete}
                title="Delete Team"
                message={`Are you sure you want to delete the team "${confirmDelete?.name}"?`}
                />
                
            </div>
            );
}
