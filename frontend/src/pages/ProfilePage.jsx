import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Lock, Check, X, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";

const ProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { authUser, isUpdatingProfile, updateProfile, updatePassword, getUserByUsername } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(true);
  const [profileUser, setProfileUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
  });

  // Load profile data when component mounts or username changes
  useEffect(() => {
    const loadProfile = async () => {
      if (username === 'me' || username === authUser?.username) {
        // Viewing own profile
        setIsCurrentUser(true);
        setProfileUser(authUser);
        setFormData({
          fullName: authUser?.fullName || "",
          email: authUser?.email || "",
        });
        setSelectedImg(null); // Always clear preview to use global authUser.profilePic
      } else {
        // Viewing another user's profile
        setIsCurrentUser(false);
        try {
          const user = await getUserByUsername(username);
          if (user) {
            setProfileUser(user);
            setFormData({
              fullName: user.fullName || "",
              email: user.email || "",
            });
            setSelectedImg(user.profilePic || null);
          } else {
            toast.error("User not found");
            navigate("/");
          }
        } catch (error) {
          toast.error("Failed to load profile");
          navigate("/");
        }
      }
    };

    if (authUser) {
      loadProfile();
    }
  }, [username, authUser, navigate, getUserByUsername]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, JPG, or WebP)');
      return;
    }

    // Check file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    try {
      // Convert file to base64
      const imageData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });

      // Update the UI immediately for better UX
      setSelectedImg(imageData);
      
      // Only update form data if in edit mode
      if (isEditing) {
        setFormData(prev => ({
          ...prev,
          profilePic: imageData
        }));
      }
      
      // Do NOT update the profile here. Only set preview and form data.
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process the image. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async () => {
    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await updateProfile({
        fullName: formData.fullName,
        email: formData.email,
        profilePic: selectedImg,
      });
      
      // After update, clear preview so UI uses updated global authUser.profilePic
      setSelectedImg(null);
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to update profile");
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      await updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      // Clear the password form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      setShowPasswordForm(false);
      toast.success("Password updated successfully!");
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to update password");
    }
  };

  if (!profileUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 py-8">
        <div className="bg-base-100 rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <button 
                    onClick={() => navigate(-1)} 
                    className="btn btn-circle btn-ghost btn-sm"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-2xl font-bold">
                    {isCurrentUser ? 'Your Profile' : `${profileUser.fullName}'s Profile`}
                  </h1>
                </div>
                <p className="opacity-90 pl-9">
                  {isCurrentUser ? 'Manage your account information and security' : ''}
                </p>
              </div>
              <div className="avatar">
                <div className="w-16 rounded-full ring ring-white ring-offset-base-100 ring-offset-2">
                  <img 
                    src={selectedImg || authUser?.profilePic || "/avatar.png"} 
                    alt={authUser?.fullName} 
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Profile Info Section */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  {isCurrentUser ? 'Your Information' : 'Profile Information'}
                </h2>
                {isCurrentUser && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-ghost btn-sm text-primary"
                  >
                    Edit Profile
                  </button>
                )}
                {isCurrentUser && isEditing && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleProfileUpdate}
                      className="btn btn-primary btn-sm"
                      disabled={isUpdatingProfile}
                    >
                      {isUpdatingProfile ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          fullName: profileUser?.fullName || "",
                          email: profileUser?.email || "",
                        });
                      }}
                      className="btn btn-ghost btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      disabled={isUpdatingProfile}
                    />
                  ) : (
                    <div className="px-4 py-3 bg-base-200 rounded-lg">
                      {authUser?.fullName}
                    </div>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </span>
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      disabled={isUpdatingProfile}
                    />
                  ) : (
                    <div className="px-4 py-3 bg-base-200 rounded-lg">
                      {authUser?.email}
                    </div>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Profile Picture
                    </span>
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="avatar">
                      <div className="w-16 rounded-full">
                        <img 
                          src={selectedImg || authUser?.profilePic || "/avatar.png"} 
                          alt={authUser?.fullName} 
                        />
                      </div>
                    </div>
                    <div>
                      <label 
                        htmlFor="avatar-upload" 
                        className={`btn btn-sm ${isUpdatingProfile ? 'btn-disabled' : 'btn-outline'}`}
                      >
                        {isUpdatingProfile ? 'Uploading...' : 'Change Photo'}
                        <input
                          type="file"
                          id="avatar-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageChange}
                          disabled={isUpdatingProfile}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">JPG, GIF or PNG. Max 2MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="border-t border-base-300 pt-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Change Password</h2>
                  <p className="text-sm text-gray-500">Update your password</p>
                </div>
                {!showPasswordForm ? (
                  <button 
                    onClick={() => setShowPasswordForm(true)}
                    className="btn btn-ghost btn-sm"
                  >
                    Change Password
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowPasswordForm(false)}
                      className="btn btn-sm btn-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {showPasswordForm && (
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Current Password</span>
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="input input-bordered w-full"
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">New Password</span>
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="input input-bordered w-full"
                      minLength={6}
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Confirm New Password</span>
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className={`input input-bordered w-full ${
                        passwordData.newPassword && 
                        passwordData.confirmPassword && 
                        passwordData.newPassword !== passwordData.confirmPassword 
                          ? 'input-error' 
                          : ''
                      }`}
                      minLength={6}
                      required
                    />
                    {passwordData.newPassword && 
                     passwordData.confirmPassword && 
                     passwordData.newPassword !== passwordData.confirmPassword && (
                      <label className="label">
                        <span className="label-text-alt text-error">
                          Passwords don't match
                        </span>
                      </label>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={
                        !passwordData.currentPassword || 
                        !passwordData.newPassword || 
                        !passwordData.confirmPassword ||
                        passwordData.newPassword !== passwordData.confirmPassword ||
                        isUpdatingProfile
                      }
                    >
                      {isUpdatingProfile ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Account Info Section */}
            <div className="mt-8 pt-6 border-t border-base-300">
              <h2 className="text-lg font-semibold mb-4">Account Information</h2>
              <div className="bg-base-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium">
                    {new Date(authUser?.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Account Status</span>
                  <span className="badge badge-success gap-1">
                    <Check className="w-3 h-3" /> Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;
