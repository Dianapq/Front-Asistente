import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { FaPaperPlane, FaRobot, FaUser } from 'react-icons/fa'

const ChatPrompt = () => {
  const [nombreUsuario, setNombreUsuario] = useState('');
const [nombreEmpresa, setNombreEmpresa] = useState('');
const [fase, setFase] = useState('preguntarNombre');
const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversations, setConversations] = useState([])
  const conversationsEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Auto-scroll cuando hay nuevos mensajes
  useEffect(() => {
    if (conversationsEndRef.current) {
      conversationsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversations])

  // Enviar primer mensaje al backend con el nombre del usuario y empresa
  useEffect(() => {
    if (fase === 'chat' && conversations.length === 0) {
      const initialMessage = `Hola, soy ${nombreUsuario} de la empresa ${nombreEmpresa}.`;
      handleSendMessage(initialMessage);
    }
  }, [fase, nombreUsuario, nombreEmpresa]);

  // Cargar conversación anterior al iniciar sesión
  useEffect(() => {
    const cargarConversacionAnterior = async () => {
      if (nombreUsuario && nombreEmpresa) {
        try {
          setIsLoading(true);
          const response = await fetch(
            `https://back-asitente.vercel.app/api/load-conversation?nombreUsuario=${encodeURIComponent(nombreUsuario)}&nombreEmpresa=${encodeURIComponent(nombreEmpresa)}`
          );

          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            setConversations(data.messages);
          }
        } catch (error) {
          console.error('Error al cargar conversación:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    cargarConversacionAnterior();
  }, [nombreUsuario, nombreEmpresa]);

  // Agregar manejador de tecla Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevenir el salto de línea por defecto
      handleSubmit(e); // Enviar el mensaje
    }
  };

  const handleSendMessage = async (message) => {
    try {
      if (!message.trim()) return;

      const newMessage = { role: 'user', content: message };
      
      // Actualizar UI inmediatamente
      setConversations(prev => [...prev, newMessage]);
      setIsLoading(true);

      const response = await fetch('https://back-asitente.vercel.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,  // Cambiado: enviamos solo el mensaje actual
          nombreUsuario,
          nombreEmpresa
        }),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.response) {
        setConversations(prev => [...prev, {
          role: 'assistant',
          content: data.response
        }]);
      } else {
        throw new Error('Respuesta inválida del servidor');
      }

      setPrompt('');
    } catch (error) {
      console.error('Error:', error);
      setConversations(prev => [...prev, {
        role: 'system',
        content: 'Hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar handleSubmit y reemplazarlo por este
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    await handleSendMessage(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }

  // Función para formatear el texto con saltos de línea
  const formatText = (text) => {
    // Divide el texto en párrafos y los une con saltos de línea en JSX
    return text.split('\n').map((paragraph, i) => (
      <p key={i} className="mb-2 last:mb-0">{paragraph}</p>
    ));
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm('¿Estás seguro que deseas cerrar la sesión? Se perderá el acceso a esta conversación.');
    
    if (confirmLogout) {
      try {
        setIsLoading(true);
        
        // Intentar guardar la conversación antes de cerrar
        if (conversations.length > 0) {
          const response = await fetch('https://back-asitente.vercel.app/api/save-conversation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nombreUsuario,
              nombreEmpresa,
              messages: conversations
            }),
          });

          if (!response.ok) {
            throw new Error('Error al guardar la conversación');
          }

          // Solo limpiar el estado si se guardó correctamente
          setNombreUsuario('');
          setNombreEmpresa('');
          setFase('preguntarNombre');
          setConversations([]);
          setPrompt('');
        }
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Hubo un error al guardar la conversación. ¿Deseas cerrar la sesión de todos modos?');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="bg-white shadow-2xl rounded-xl overflow-hidden border border-purple-200 mx-auto max-w-2xl">
      {/* Header del chat con botón de cerrar sesión */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex justify-between items-center shadow-md">
        <h2 className="text-xl font-bold flex items-center">
          <FaRobot className="mr-2 text-purple-200" /> ChatGPT App
        </h2>
        {fase === 'chat' && (
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 flex items-center text-sm h-[40px] w-[140px] justify-center flex-shrink-0 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-2 flex-shrink-0" 
              viewBox="0 0 20 20" 
              fill="currentColor"
              style={{ minWidth: '16px' }}
            >
              <path fillRule="evenodd" d="M3 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3zm11 4.414l-1.293-1.293a1 1 0 0 0-1.414 1.414L13.586 9H7a1 1 0 1 0 0 2h6.586l-2.293 2.293a1 1 0 1 0 1.414 1.414L14 13.414V7.414z" clipRule="evenodd"/>
            </svg>
            <span className="whitespace-nowrap">Cerrar Sesión</span>
          </button>
        )}
      </div>
      
      {/* Historial de conversaciones con mejor formateo - Altura fija */}
      <div className="h-[400px] overflow-y-auto p-4 bg-gradient-to-b from-purple-50 to-white">
        {fase === 'preguntarNombre' ? (
          <div className="text-center text-purple-800 space-y-4">
            <p className="text-lg font-medium">¡Hola! 👋 Soy <strong>Manuel</strong>, asesor virtual de <strong>DH Ecoambiental</strong>.</p>
            <p>¿Cuál es tu nombre?</p>
            <input
              type="text"
              className="p-2 border border-purple-300 rounded-md w-full max-w-sm mx-auto"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  setNombreUsuario(e.target.value.trim());
                  setFase('preguntarEmpresa');
                }
              }}
              autoFocus
            />
          </div>
        ) : fase === 'preguntarEmpresa' ? (
          <div className="text-center text-purple-800 space-y-4">
            <p>¡Gracias, {nombreUsuario}! 😊</p>
            <p>¿Cuál es el nombre de tu empresa?</p>
            <input
              type="text"
              className="p-2 border border-purple-300 rounded-md w-full max-w-sm mx-auto"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  setNombreEmpresa(e.target.value.trim());
                  setFase('chat');
                }
              }}
              autoFocus
            />
          </div>
        ) : fase === 'chat' ? (
          conversations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600">
              <div className="p-6 bg-purple-100 rounded-full mb-4 shadow-inner">
                <FaRobot className="text-5xl text-purple-600" />
              </div>
              <p className="text-xl font-semibold text-purple-800">¡Bienvenido al Chat! 👋</p>
              <p className="mt-2 text-purple-600">¿En qué puedo ayudarte hoy?</p>
            </div>
          ) : (
            <div className="space-y-5">
              {conversations.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] p-3 rounded-2xl shadow-md ${
                      message.role === 'user' 
                        ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-tr-none' 
                        : message.role === 'system'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-white text-gray-800 border border-purple-100 rounded-tl-none shadow-md'
                    }`}
                  >
                    <div className="flex items-center mb-1 font-medium">
                      {message.role === 'user' ? (
                        <>
                          <FaUser className="mr-1 text-white" /> <span className="text-white font-bold">Tú</span>
                        </>
                      ) : message.role === 'system' ? (
                        'Sistema'
                      ) : (
                        <>
                          <FaRobot className="mr-1 text-purple-600" /> <span className="text-purple-800">ChatGPT</span>
                        </>
                      )}
                    </div>
                    <div className={`whitespace-pre-wrap leading-relaxed text-sm md:text-base ${message.role === 'user' ? 'font-medium text-white' : ''}`}>
                      {formatText(message.content)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={conversationsEndRef} />
            </div>
          )
        ) : null}
        
        {isLoading && (
          <div className="flex justify-start mt-4">
            <div className="max-w-[85%] p-3 bg-white border border-purple-100 rounded-2xl rounded-tl-none shadow-md">
              <div className="flex items-center mb-1 font-medium">
                <FaRobot className="mr-1 text-purple-600" /> <span className="text-purple-800">ChatGPT</span>
              </div>
              <div className="flex space-x-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Formulario para enviar el prompt - Botón debajo del texto */}
      {fase === 'chat' && (
        <form onSubmit={handleSubmit} className="p-4 bg-gradient-to-r from-purple-100 to-indigo-100 border-t border-purple-200">
          <div className="mb-2">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje aquí..."
              className="w-full p-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800 resize-none shadow-inner transition-all"
              rows="2"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex items-center">
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center"
            >
              <FaPaperPlane className="mr-2" /> Enviar
            </button>
          </div>
          
          <p className="text-xs text-purple-500 mt-1 text-center">
            {isLoading ? '⏳ Procesando...' : '💬 Presiona Enter para enviar'}
          </p>
        </form>
      )}
    </div>
  );
};

export default ChatPrompt;
