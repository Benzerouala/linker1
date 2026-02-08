import { useEffect, useState } from "react";

import { useNavigate, Link } from "react-router-dom";

import { getImageUrl } from "../utils/imageHelper";

import ConfirmModal from "./ConfirmModal";

import LikesModal from "./LikesModal";



const NestedReply = ({

  reply,

  onLike,

  onReply,

  currentUserId,

  expandedReplyId,

  setExpandedReplyId,

  nestedReplyText,

  setNestedReplyText,

  nestedReplyLoading,

  isMyReply,

  formatDate,

  childReplies = [],

  replyLikes = {},

  collapseSignal,

  autoExpandReplyIds,

  apiUrl,

  onRepost,

  onDelete,

}) => {

  const [showChildren, setShowChildren] = useState(false);

  const [showReplyLikesModal, setShowReplyLikesModal] = useState(false);

  const [replyLikesLoading, setReplyLikesLoading] = useState(false);

  const [replyLikesUsers, setReplyLikesUsers] = useState([]);

  const [showLoginModal, setShowLoginModal] = useState(false);

  const [loginModalMessage, setLoginModalMessage] = useState("");

  const navigate = useNavigate();

  const isLiked = replyLikes[reply._id] || false;

  const likesCount = reply.likesCount || 0;

  const repliesCount = childReplies?.length || reply.repliesCount || 0;

  const isExpanded = expandedReplyId === reply._id;

  const isCurrentUser = isMyReply(reply.author?._id);

  const profileLink = isCurrentUser ? "/dashboard/profile" : `/profile/${reply.author?.username}`;



  const ensureLoggedIn = (message) => {

    const token = localStorage.getItem("token");

    if (!token) {

      setLoginModalMessage(message);

      setShowLoginModal(true);

      return false;

    }

    return true;

  };



  useEffect(() => {

    setShowChildren(false);

  }, [collapseSignal]);



  useEffect(() => {

    if (autoExpandReplyIds?.has(reply._id)) {

      setShowChildren(true);

    }

  }, [autoExpandReplyIds, reply._id, collapseSignal]);



  const handleReplyLikesClick = async (e) => {

    e.preventDefault();

    e.stopPropagation();

    setShowReplyLikesModal(true);

    try {

      setReplyLikesLoading(true);

      const token = localStorage.getItem("token");

      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const baseUrl =

        apiUrl || import.meta.env.VITE_API_URL || "https://backend-linker.onrender.com/api";

      const response = await fetch(`${baseUrl}/replies/${reply._id}/likes`, {

        headers,

      });

      const data = await response.json();

      if (data.success) {

        setReplyLikesUsers(data.data?.users || []);

      } else {

        setReplyLikesUsers([]);

      }

    } catch (error) {

      console.error("Error fetching reply likes:", error);

      setReplyLikesUsers([]);

    } finally {

      setReplyLikesLoading(false);

    }

  };



  return (

    <div className="reply-item-with-children" id={`reply-${reply._id}`}>

      {/* Réponse parente */}

      <div

        className={`reply-item ${!isMyReply(reply.author?._id) ? "hoverable" : ""}`}

      >

        {reply.author?.username ? (

          <Link

            to={profileLink}

            className="reply-avatar-link"

            title={isCurrentUser ? "Voir mon profil" : `Voir le profil de @${reply.author.username}`}

          >

            <img

              src={

                getImageUrl(

                  reply.author?.profilePicture,

                  "avatar",

                  reply.author?.username,

                ) || "/placeholder.svg"

              }

              alt={reply.author?.username}

              className="reply-avatar-img"

              onError={(e) =>

                (e.target.src = getImageUrl(null, "avatar", reply.author?.username))

              }

            />

          </Link>

        ) : (

          <img

            src={

              getImageUrl(

                reply.author?.profilePicture,

                "avatar",

                reply.author?.username,

              ) || "/placeholder.svg"

            }

            alt={reply.author?.username}

            className="reply-avatar-img"

            onError={(e) =>

              (e.target.src = getImageUrl(null, "avatar", reply.author?.username))

            }

          />

        )}

        <div className="reply-content">

          <div className="reply-header">

            {reply.author?.username ? (

              <Link

                to={profileLink}

                className="reply-author"

                title={isCurrentUser ? "Voir mon profil" : `Voir le profil de @${reply.author.username}`}

              >

                {reply.author?.name || reply.author?.username}

                {reply.author?.isVerified && (

                  <span className="verified-badge">✓</span>

                )}

                {isMyReply(reply.author?._id) && (

                  <span className="reply-badge-you">Vous</span>

                )}

              </Link>

            ) : (

              <span className="reply-author">

                {reply.author?.name || reply.author?.username}

                {reply.author?.isVerified && (

                  <span className="verified-badge">✓</span>

                )}

                {isMyReply(reply.author?._id) && (

                  <span className="reply-badge-you">Vous</span>

                )}

              </span>

            )}

            <span className="reply-time">{formatDate(reply.createdAt)}</span>

            {isMyReply(reply.author?._id) && onDelete && (

              <div className="reply-header-actions">

                <button

                  type="button"

                  className="reply-action-btn reply-delete-btn"

                  title="Supprimer"

                  onClick={() => onDelete(reply)}

                >

                  <svg

                    className="reply-action-icon"

                    fill="none"

                    stroke="currentColor"

                    viewBox="0 0 24 24"

                  >

                    <path

                      strokeLinecap="round"

                      strokeLinejoin="round"

                      strokeWidth={2}

                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m2 0V5a2 2 0 012-2h2a2 2 0 012 2v2"

                    />

                  </svg>

                </button>

              </div>

            )}

          </div>

          <div className="reply-text">{reply.content}</div>



          {/* Afficher les stats */}

          <div className="reply-stats">

            {likesCount > 0 && (

              <span

                className="reply-likes-count"

                onClick={handleReplyLikesClick}

                role="button"

                tabIndex={0}

                onKeyDown={(e) => {

                  if (e.key === "Enter" || e.key === " ") {

                    handleReplyLikesClick(e);

                  }

                }}

              >

                ❤️ {likesCount} J'aime

              </span>

            )}

            {repliesCount > 0 && (

              <span

                className="reply-replies-count"

                onClick={() => setShowChildren((prev) => !prev)}

              >

                💬 {repliesCount} réponse{repliesCount > 1 ? "s" : ""}

              </span>

            )}

          </div>

        </div>



        {/* Actions (Like/Répondre) - SEULEMENT si pas votre message */}

        {!isMyReply(reply.author?._id) && (

          <div className="reply-hover-actions">

            {/* Bouton Like */}

            <button

              onClick={() => {

                onLike(reply._id);

              }}

              className={`reply-action-btn ${isLiked ? "liked" : ""}`}

              title="J'aime"

            >

              <svg

                className="reply-action-icon"

                fill={isLiked ? "currentColor" : "none"}

                stroke="currentColor"

                viewBox="0 0 24 24"

              >

                <path

                  strokeLinecap="round"

                  strokeLinejoin="round"

                  strokeWidth={2}

                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"

                />

              </svg>

            </button>



            {/* Bouton Répondre */}

            <button

              onClick={() => {

                if (!ensureLoggedIn("Veuillez vous connecter pour commenter")) {

                  return;

                }

                setExpandedReplyId(isExpanded ? null : reply._id);

              }}

              className="reply-action-btn"

              title="Répondre"

            >

              <svg

                className="reply-action-icon"

                fill="none"

                stroke="currentColor"

                viewBox="0 0 24 24"

              >

                <path

                  strokeLinecap="round"

                  strokeLinejoin="round"

                  strokeWidth={2}

                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"

                />

              </svg>

            </button>



            {onRepost && (

              <button

                onClick={() => onRepost(reply._id)}

                className="reply-action-btn"

                title="Reposter"

              >

                <svg

                  className="reply-action-icon"

                  fill="none"

                  stroke="currentColor"

                  viewBox="0 0 24 24"

                >

                  <path

                    strokeLinecap="round"

                    strokeLinejoin="round"

                    strokeWidth={2}

                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"

                  />

                </svg>

              </button>

            )}

          </div>

        )}

      </div>



      {/* ✅ FORMULAIRE IMBRIQUÉ - S'affiche quand isExpanded */}

      {isExpanded && (

        <div className="nested-reply-form">

          <form

            onSubmit={(e) => {

              e.preventDefault();

              onReply(e, reply._id);

            }}

            className="reply-form"

          >

            <div className="reply-input-wrapper">

              <input

                type="text"

                value={nestedReplyText[reply._id] || ""}

                onChange={(e) => {

                  const token = localStorage.getItem("token");

                  if (!token) return;

                  setNestedReplyText((prevText) => ({

                    ...prevText,

                    [reply._id]: e.target.value,

                  }));

                }}

                onFocus={() => {

                  ensureLoggedIn("Veuillez vous connecter pour commenter");

                }}

                onClick={() => {

                  ensureLoggedIn("Veuillez vous connecter pour commenter");

                }}

                placeholder={`Répondre à @${reply.author?.username}...`}

                className="reply-input"

                autoFocus

              />

              <button

                type="submit"

                disabled={

                  !nestedReplyText[reply._id]?.trim() ||

                  nestedReplyLoading[reply._id]

                }

                className="reply-submit-btn"

              >

                {nestedReplyLoading[reply._id] ? (

                  <svg

                    className="loading-spinner"

                    fill="none"

                    viewBox="0 0 24 24"

                  >

                    <circle

                      className="spinner-path"

                      cx="12"

                      cy="12"

                      r="10"

                      stroke="currentColor"

                      strokeWidth="4"

                      fill="none"

                    />

                  </svg>

                ) : (

                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">

                    <path

                      strokeLinecap="round"

                      strokeLinejoin="round"

                      strokeWidth={2}

                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"

                    />

                  </svg>

                )}

              </button>

            </div>

          </form>

        </div>

      )}



      {/* ✅ AFFICHER LES ENFANTS */}

      {childReplies && childReplies.length > 0 && showChildren && (

        <div className="nested-reply-container">

          {childReplies.map((childReply) => (

            <NestedReply

              key={childReply._id}

              reply={childReply}

              onLike={onLike}

              onReply={onReply}

              currentUserId={currentUserId}

              expandedReplyId={expandedReplyId}

              setExpandedReplyId={setExpandedReplyId}

              nestedReplyText={nestedReplyText}

              setNestedReplyText={setNestedReplyText}

              nestedReplyLoading={nestedReplyLoading}

              isMyReply={isMyReply}

              formatDate={formatDate}

              replyLikes={replyLikes}

              autoExpandReplyIds={autoExpandReplyIds}

              apiUrl={apiUrl}

              onRepost={onRepost}

              onDelete={onDelete}

              childReplies={childReply.children || []}

            />

          ))}

        </div>

      )}



      <LikesModal

        isOpen={showReplyLikesModal}

        title="J'aime"

        users={replyLikesUsers}

        loading={replyLikesLoading}

        onClose={() => setShowReplyLikesModal(false)}

      />



      <ConfirmModal

        isOpen={showLoginModal}

        title="Connexion requise"

        message={loginModalMessage || "Veuillez vous connecter pour continuer."}

        confirmText="Se connecter"

        cancelText="Annuler"

        onConfirm={() => {

          setShowLoginModal(false);

          navigate("/login");

        }}

        onCancel={() => setShowLoginModal(false)}

      />

    </div>

  );

};



export default NestedReply;

