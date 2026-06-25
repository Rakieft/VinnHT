import React, { useEffect, useState } from "react";
import { ArrowLeft, CircleUserRound, MessageCircle, Search, Send } from "lucide-react";
import { useLocation } from "react-router-dom";
import { assetUrl } from "../config/runtime.js";

function ConversationAvatar({ image, name, large = false }) {
  return (
    <span className={large ? "conversation-avatar large" : "conversation-avatar"}>
      {image ? (
        <img src={assetUrl(image)} alt={name} />
      ) : (
        (name || "??").slice(0, 2).toUpperCase() || <CircleUserRound />
      )}
    </span>
  );
}

export default function MarketplaceMessages({
  api,
  user,
  sellerMode = false,
  onMobileConversationChange,
}) {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const requestedConversation = Number(queryParams.get("conversation")) || null;
  const preparedDraft = queryParams.get("draft") || "";
  const openSupport = queryParams.get("support") === "1";
  const [active, setActive] = useState(null);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [supportError, setSupportError] = useState("");
  const [mobileConversationOpen, setMobileConversationOpen] = useState(Boolean(requestedConversation || openSupport));

  useEffect(() => {
    onMobileConversationChange?.(mobileConversationOpen);
  }, [mobileConversationOpen, onMobileConversationChange]);

  const loadConversations = async (preferredConversation = null) => {
    const { data } = await api.get("/messages/conversations");
    setConversations(data);
    setActive(
      (current) =>
        preferredConversation ||
        requestedConversation ||
        current ||
        data[0]?.id ||
        null,
    );
  };

  const loadMessages = async (id) => {
    if (!id) return setMessages([]);
    const { data } = await api.get(`/messages/conversations/${id}`);
    setMessages(data);
  };

  useEffect(() => {
    const initialize = async () => {
      let supportConversation = null;
      try {
        if (openSupport && !sellerMode) {
          const { data } = await api.post("/messages/support");
          supportConversation = data.id;
          setMobileConversationOpen(true);
        }
        await loadConversations(supportConversation);
      } catch (error) {
        setSupportError(
          error.response?.data?.message ||
            "Impossible d’ouvrir le support VinnHT.",
        );
      }
    };
    initialize();
    if (preparedDraft) setDraft(preparedDraft);
    if (!sellerMode) api.get("/messages/contacts").then(({ data }) => setContacts(data));
    const interval = window.setInterval(loadConversations, 10000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    loadMessages(active);
  }, [active]);

  const startConversation = async (event) => {
    if (!event.target.value) return;
    const { data } = await api.post("/messages/conversations", {
      sellerId: event.target.value,
    });
    await loadConversations();
    setActive(data.id);
    setMobileConversationOpen(true);
    event.target.value = "";
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !active) return;
    await api.post(`/messages/conversations/${active}`, { body: draft.trim() });
    setDraft("");
    await Promise.all([loadMessages(active), loadConversations()]);
  };

  const visible = conversations.filter((item) =>
    (item.name || "").toLowerCase().includes(query.toLowerCase())
  );
  const current = conversations.find((item) => item.id === active);

  return (
    <div className="seller-flow marketplace-messages-page">
      {supportError && <div className="seller-message">{supportError}</div>}
      <div className={`client-messages-shell ${mobileConversationOpen ? "conversation-open" : ""}`}>
        <aside className="conversation-list">
          {!sellerMode && (
            <select defaultValue="" onChange={startConversation}>
              <option value="" disabled>
                Nouvelle conversation
              </option>
              {contacts.map((contact) => (
                <option value={contact.id} key={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          )}
          <label>
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher"
            />
          </label>
          <div className="conversation-contacts-scroll">
            {visible.map((conversation) => (
              <button
                className={active === conversation.id ? "active" : ""}
                onClick={() => {
                  setActive(conversation.id);
                  setMobileConversationOpen(true);
                }}
                key={conversation.id}
              >
                <ConversationAvatar image={conversation.image_url} name={conversation.name} />
                <p>
                  <b>{conversation.name}</b>
                  <small>{conversation.last_message || "Nouvelle conversation"}</small>
                </p>
                <time>{conversation.unread_count ? `${conversation.unread_count} nouveau` : ""}</time>
              </button>
            ))}
            {!visible.length && (
              <div className="conversation-list-empty">
                Aucune discussion trouvée.
              </div>
            )}
          </div>
        </aside>
        <section className="conversation-room">
          {current ? (
            <>
              <header>
                <button
                  type="button"
                  className="messages-mobile-back"
                  onClick={() => setMobileConversationOpen(false)}
                  aria-label="Retour aux discussions"
                >
                  <ArrowLeft />
                </button>
                <ConversationAvatar image={current.image_url} name={current.name} large />
                <div>
                  <h3>{current.name}</h3>
                  <p>
                    <i />
                    Conversation sécurisée VinnHT
                  </p>
                </div>
                <button aria-label="Profil">
                  <CircleUserRound />
                </button>
              </header>
              <div className="message-history">
                {messages.map((message) => (
                  <p
                    className={Number(message.sender_id) === Number(user.id) ? "sent" : "received"}
                    key={message.id}
                  >
                    {message.body}
                  </p>
                ))}
              </div>
              <form onSubmit={sendMessage}>
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Écrire un message..."
                />
                <button aria-label="Envoyer le message">
                  <Send />
                </button>
              </form>
            </>
          ) : (
            <div className="messages-empty">
              <MessageCircle />
              <h3>{sellerMode ? "Aucun message client" : "Commencez une conversation"}</h3>
              <p>
                {sellerMode
                   ? "Les nouvelles questions de vos clients apparaîtront ici."
                  : "Choisissez une boutique dans la liste."}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
