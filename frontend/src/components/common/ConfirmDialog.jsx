import { useSelector, useDispatch } from "react-redux";
import { hideDialog } from "../../redux/slices/confirmDialogSlice";

const ConfirmDialog = () => {
  const { open, title, message, onConfirm, onCancel } = useSelector(
    (state) => state.confirmDialog
  );
  const dispatch = useDispatch();

  if (!open) return null;

  const handleConfirm = () => {
    dispatch(hideDialog());
    if (onConfirm) onConfirm();
  };

  const handleCancel = () => {
    dispatch(hideDialog());
    if (onCancel) onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
